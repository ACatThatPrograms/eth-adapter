import { ethers } from 'ethers';
import { configFileName } from "./const.js";
import { readArtifactsDirectory, writeProcessCwdFile } from "./util.js";
import { rl } from './util.js';

const defaultConfig = {
    alwaysCompile: false, // Should eth-adapter skip the artifact hash check?
    contractAddresses: {}, // Contract addresses for artifact files
};

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
    await writeProcessCwdFile(
        configFileName,
        "module.exports.ethAdapterConfig = " + JSON.stringify(newConfig, false, 2)
    );
    console.log(`\n\x1B[0;32mSuccessfully wrote new config file to ${process.cwd()+"/"+configFileName} ${!requestAddresses ? '\n\n\x1B[1;33mRemember to fill out the contract addresses in the newly created file before running the transpiler\n' : "\n"}`)
};

export const loadConfig = async () => {
    try {
        let { ethAdapterConfig } = await import(process.cwd() + "/" + configFileName);
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
