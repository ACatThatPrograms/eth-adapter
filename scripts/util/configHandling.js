import { ethers } from 'ethers';
import { configFileName } from "./const.js";
import { colorBash, readArtifactsDirectory, writeProcessCwdFile } from "./util.js";
import { rl } from './util.js';
import { readFile } from 'fs/promises'

const defaultConfig = {
    alwaysCompile: false, // Should eth-adapter skip the artifact hash check?
    contractAddresses: {}, // Contract addresses for artifact files
    promptForUpdateOnArtifactChange: false, // When artifacts change, should prompt ask for configuration update? False will always update with 0x0
    hashes: {
        artifacts: "0x0",
        config: "0x0"
    }
};

/**
 * Return configuration as a JSON string
 */
 export async function getConfigAsString() {
    return JSON.stringify(await loadConfig());
}

export const generateDefaultConfig = async () => {
    // Read artifacts for estimating required needs
    let artifactFiles = await readArtifactsDirectory();
    const newConfig = { ...defaultConfig }; // Clone default config in for set-up
    if (!artifactFiles) {
        console.log(`
            \n\x1B[36mNo artifacts detected; You should add contract artifacts to /artifacts prior to running \x1B[33mnpx ethinit\x1B[33m
        `)
    }
    // Should we request contract addresses for config?
    let reqAdrs = await rl.question("\x1B[1;35m\nFill out the deployed addresses for contracts now? y|n (Enter for no): ");
    const requestAddresses = reqAdrs === "y" || reqAdrs === "Y";
    // Inject artifactFiles contract name skeleton and request addresses if necessary
    let invCount = 0;
    const askForAddress = async (filename, wasWrong=false) => {
        let address = await rl.question(`\n${wasWrong ? `Invalid address (Attempt ${invCount}/2) => ` : ""}\x1B[0;34mWhat is the address for ${filename}?: `)
        if (ethers.utils.isAddress(address)) {
            invCount=0;
            return address;
        } else {
            if (invCount >= 2) {
                console.log(`\x1B[0;33m\nSetting ${filename} address as 0x0 -- You can upate it later in ${configFileName}`)
                return "0x0";
            }
            invCount++;
            return await askForAddress(filename, true); 
        }
    }
    for (let i=0; i<artifactFiles.length;i++) {
        let cAddress = "0x0";
        let filename = artifactFiles[i];
        if (requestAddresses) {
            cAddress = await askForAddress(filename);
        }
        newConfig.contractAddresses[filename.toUpperCase().replace(".JSON", "")] = cAddress;
    }
    // Write the file
    await writeConfigFile(newConfig);
    console.log(`\n\x1B[0;32mSuccessfully wrote new config file to ${process.cwd()+"/"+configFileName} ${!requestAddresses ? '\n\n\x1B[1;33mRemember to fill out the contract addresses in the newly created file before running the transpiler\n' : "\n"}`)
    return newConfig;
};

export const writeConfigFile = async (newConfigAsObject) => {
    await writeProcessCwdFile(
        configFileName,
        JSON.stringify(newConfigAsObject, false, 2)
    );
}

export const loadConfig = async () => {
    try {
        let ethAdapterConfig = JSON.parse((await readFile(process.cwd() + "/" + configFileName)).toString());
        return ethAdapterConfig;
    } catch (ex) {
        if (ex.code === "ERR_MODULE_NOT_FOUND") {
            console.log(
                `\n\x1B[36mNo eth-adapter config found, attempting to fall back on .env for contract configuration\nGenerate new config with \x1B[33mnpx ethinit\x1B[36m for better feature support\x1B[33m\n`
            );
            return false;
        } else {
            console.log("Loading eth-adapter config error:")
            throw new Error(ex);
        }
    }
};

export const requestAddressConfigUpdate = async () => {
    let configurationFile = await loadConfig();
    if (configurationFile.promptForUpdateOnArtifactChange) {   
        let reconfigureAnswer = await rl.question(`${colorBash.cyanB}An artifact change was detected!\n${colorBash.cyan}Would you like to automatically reconfigure ${colorBash.lblue}${configFileName}${colorBash.blue} ?${colorBash.yellow} y|n (Enter for yes): `)
        if (reconfigureAnswer.toLocaleLowerCase() === "n") {
            return false;
        } else {
            return await amendConfigFile();
        }
    } else {
        console.log(`${colorBash.yellowB}NOTICE:${colorBash.yellow} Inbalance between artifacts & configuration file, amending...`)
        return await amendConfigFile();
    }
}

export const amendConfigFile = async () => {
    // Find the corresponding address key for the configObj contractAddresses by artifactFileName
    const determineMatchingConfigAddressKeyFromArtifactFileName = (configFileAddresses, artifactFileNameToFind) => {
        let returnKey = false;
        Object.keys(configFileAddresses).forEach(configContractAddressKey => {
            if ((configContractAddressKey.toLowerCase()).indexOf(artifactFileNameToFind.toLowerCase().replace(".json", "")) !== -1) {
                returnKey = configContractAddressKey;
            }
        })
        return returnKey;
    }

    let ammendedContractAddressConfig = {};

    // 1. Read existing config
    let configFile = await loadConfig();
    // Extract definedContractConfigs and sort alphabetically
    let definedContractConfigs = Object.keys(configFile.contractAddresses).map(key => key.toLowerCase() + ".json");
    // 2. Read artifacts files and extract names ; sort them alphabetically
    let artifactFiles = await readArtifactsDirectory();
    // 3. If config has artifact file entry, keep existing address
    let newAdded = [];
    let longestName = 0;
    for (let i=0; i<artifactFiles.length;i++) {
        let artifactFileName = artifactFiles[i] 
        let configObjectAddressKey = determineMatchingConfigAddressKeyFromArtifactFileName(configFile.contractAddresses,artifactFileName)
        // If key exists, config has entry for the address and should be re-used
        if (configObjectAddressKey) {
            console.log(`${colorBash.lblue}Previous configuration found for ${configObjectAddressKey}, using address ${configFile.contractAddresses[configObjectAddressKey]} in amendment`)
            ammendedContractAddressConfig[configObjectAddressKey] = configFile.contractAddresses[configObjectAddressKey];
            if (configObjectAddressKey.length > longestName) {
                longestName = configObjectAddressKey.length;
            }
        } else { // 4. If config does not have an artifact file entry, add it with 0x0 -- SHOW WARNINGG UP ADDITIONS WITH 0x0
            let configKey = artifactFileName.replace(".json", "").toUpperCase()
            console.log(`${colorBash.yellow}Previous configuration ${colorBash.yellowB}not found${colorBash.yellow} for ${configKey}, adding with address 0x0`)
            ammendedContractAddressConfig[configKey] = "0x0"
            newAdded.push(configKey.toUpperCase());
            if (configKey.length > longestName) {
                longestName = configKey.length;
            }
        }
    }
    if (newAdded.length > 0) {
        console.log(`\n${colorBash.yellowB}New entries added to config for the following contracts:\n${colorBash.yellow}\n${newAdded.map(name => `${name.padStart(longestName, " ")} : 0x0    `).join("\n")}`)
    }

    //5. If config has entries that are not artifact/FILENAMES don't add them and log it
    definedContractConfigs.forEach(configEntry => {
        let contractConfigInNewConfig = determineMatchingConfigAddressKeyFromArtifactFileName(ammendedContractAddressConfig, configEntry)
        // If configKey cant be parsed from new config, it was removed -- Log it
        if (!contractConfigInNewConfig) {
            console.log(`${colorBash.redB}${configEntry.replace(".json", "").toUpperCase()}${colorBash.red} address entry was removed from ${colorBash.lblue}${configFileName}`)
        }
    })

    // Write the amended file
    let newConfig = {...configFile}
    newConfig.contractAddresses = {...ammendedContractAddressConfig};
    await writeConfigFile(newConfig)
    console.log(`\n${colorBash.lblueB}${configFileName}${colorBash.yellowB} has been ammended automatically${colorBash.yellow}\nYou should manually verify contract addresses after amendment`)

}