// Grab ES6 compiled ABIs, and contract names
import { abis } from "./_abis.js";
import { CONTRACT_NAMES as contractNames } from "./_contractNames.js";

import fs from "fs/promises";

// Es6 Path resolve
import path from "path";
import { fileURLToPath } from "url";
import { configFileName } from "./util/const.js";
import { ethers } from "ethers";
import { readArtifactsDirectory } from "./util/util.js";
import { colorBash } from "./util/util.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENUM KV for contract names and addresses, used to identify contracts throughout the application
export const CONTRACT_NAMES = contractNames;
export const CONTRACT_ADDRESSES = {};
export const CONTRACT_ABIS = {};

// Simplified access to all contract data
export const CONTRACTS = {};

// Returns amount of .env entries for CONTRACT_ADDRESS
async function checkContractEnvCount() {
    let contractAddressEnvVariables = Object.keys(process.env).filter((key) => {
        return key.indexOf("CONTRACT_ADDRESS") !== -1;
    });
    return contractAddressEnvVariables.length;
}

// Builds contract configuration files -- Returns true on OK or false on fail
export async function buildContractConfig(ethAdapterConfig) {
    // Check for env variable count
    const hasEnvContractVariables = (await checkContractEnvCount()) > 0;
    // Check for config file
    // const ethAdapterConfig = await loadConfig();

    let contractConfigConstructionSuccess = false;

    if (!hasEnvContractVariables && !ethAdapterConfig) {
        console.error(
            "\x1B[1;31meth-adapter: No config file or environment file CONTRACT_ADDRESS entries found\n\n\x1B[0;31mA .env with n CONTRACT_ADDRESS where n=artifactFileCount is required.\nA configuration file is recommended to support all features\nRun \x1B[0;33mnpx ethinit\x1B[0;31m to generate a new configuration file.\n\nPlease read documentation @ https://www.npmjs.com/package/eth-adapter\n"
        );
        return false;
    }

    // Use env variables if only env available
    if (hasEnvContractVariables && !ethAdapterConfig) {
        contractConfigConstructionSuccess = await extractConfigFromEnvironment();
    }

    if (!!ethAdapterConfig && hasEnvContractVariables) {
        console.error(
            `${colorBash.BG_redB} ~~ ALERT ~~${colorBash.lred}\n${await checkContractEnvCount()} .env CONTRACT_ADDRESS entries detected alongside configuration file\nPlease remove all CONTRACT_ADDRESS entries when using ${configFileName}\n`
        );
    }

    // Use config
    if (!!ethAdapterConfig) {
        contractConfigConstructionSuccess = await extractConfigFromConfigFile(ethAdapterConfig);
    }

    // If contract config construction failed -- return false;
    if (!contractConfigConstructionSuccess) {
        return false;
    }

    // Construct ES6 syntax config
    let output = `export const CONTRACT_CONFIG = ${JSON.stringify(CONTRACTS)};`;
    // output += `\nexport default CONTRACT_CONFIG;`;
    await fs.writeFile(__dirname + "/../src/adapter/config.ts", output, "utf8");
    console.log(
        `\n\x1B[0;32mContract Config Successfully Parsed to ES6 Syntax at:\n${colorBash.cyan}${path.resolve(
            __dirname + "/../src/adapter/config.ts"
        )}\n\x1B[0m`
    );
    return contractConfigConstructionSuccess;
}

// Extract names from process.env
async function extractConfigFromEnvironment() {
    for (let environmentKey of Object.keys(process.env)) {
        // Only parse _CONTRACT_ADDRESS keys for the contract names
        if (environmentKey.indexOf("CONTRACT_ADDRESS") !== -1) {
            let contractName = environmentKey
                .replace("_CONTRACT_ADDRESS", "")
                .replace("CONTRACT_ADDRESS", "")
                .replace("REACT_APP__", "")
                .replace("REACT_APP_", "")
                .toUpperCase();
            // console.log(`\n\x1B[0;32mCorrecting  Config Successfully Parsed to ES6 Syntax in ${path.resolve(__dirname + '/../src/adapter/config.ts')}\n\x1B[0m`);
            // If file derived contract name does not exist, this means a user did not name .env KEYs the same as the artifacts/FILENAMES -- They must match
            if (!contractNames[contractName]) {
                console.warn(
                    `\n\x1B[1;33mCritical Contract Config Issue -- Please Read Below -- Aborting ETHPST transpilation.\x1B[0m`
                );
                console.warn(
                    `\n\x1B[0;33mA CONTRACTNAME derived from artifacts the directory ('./artifacts/<CONTRACTNAME>.json') !== CONTRACTNAME derived from the .env environment\nCONTRACTNAME derived from .env: ${contractName}\n\nFor Example: When using artifacts/Storage.json .env should have STORAGE_CONTRACT_ADDRESS=<ADDRESS>.\n\nThis warning can also throw if you have an inbalance of artifact files to .env key entries\nIf you have 4 Artifact files you should have 4 respective enviroment keys:value pairs\x1B[0m\n`
                );
                await analyzeEnvironmentContractEnrtyError();
                return false;
            }
            CONTRACT_NAMES[contractName] = contractName;
            CONTRACT_ADDRESSES[contractName] = process.env[environmentKey];
            let abi = setAndReturnAbiForContract(contractName);
            setContractsConfig(contractName, process.env[environmentKey], abi);
        }
    }
    return true;
}

// Extract configuration addresses from config file
async function extractConfigFromConfigFile(configFile) {
    let contractAddressNameKeys = Object.keys(configFile.contractAddresses);
    for (let i = 0; i < contractAddressNameKeys.length; i++) {
        let contractNameAndKey = contractAddressNameKeys[i];
        let contractAddress = configFile.contractAddresses[contractNameAndKey];
        if (!ethers.utils.isAddress(contractAddress)) {
            console.warn(
                `${colorBash.yellowB}Warning: ${colorBash.yellow}address (${contractAddress}) extracted for ${contractNameAndKey} is not a valid address`
            );
        }
        CONTRACT_NAMES[contractNameAndKey] = contractNameAndKey;
        CONTRACT_ADDRESSES[contractNameAndKey] = contractAddress;
        let abi = await setAndReturnAbiForContract(contractNameAndKey);
        setContractsConfig(contractNameAndKey, contractAddress, abi);
    }
    return true;
}

function setContractsConfig(contractName, contractAddress, abi) {
    CONTRACTS[contractName] = {
        name: contractName,
        address: contractAddress,
        abi: abi,
    };
}

async function setAndReturnAbiForContract(contractName) {
    try {
        let abi = JSON.parse(abis[contractName]);
        CONTRACT_ABIS[contractName] = abi;
        return abi;
    } catch (ex) {
        console.error(
            `\n\x1B[0;31mCould not parse ABI into CONTRACT_ABIS[contractName] where contractName == ${contractName} and JSON.parse(abis[contractName]) was attempted -- Verify generated abi file at ${path.resolve(
                __dirname + "/../src/adapter/abis.ts"
            )} has an entry for ${contractName}\n\x1B[0m`
        );
        console.error("Critical Eth-Adapter Compiling Error Encountered -- See Above Message");
        return false;
    }
}

async function analyzeEnvironmentContractEnrtyError() {
    console.log(`${colorBash.yellowB}See environment analysis below\n`);
    let artifactFiles = await readArtifactsDirectory();
    let envEntries = [];
    for (let aFile of artifactFiles) {
        let cName = aFile.replace(".json", "").toUpperCase();
        envEntries.push(`${cName}_CONTRACT_ADDRESS="<ADDRESS>"`);
    }
    // Files in artifacts:
    console.log(
        `${colorBash.yellow}You should have the following artifact files inside ${process.cwd() + "/artifacts/"}:\n${
            colorBash.blueB
        }${artifactFiles.join("\n")}`
    );
    console.log(
        `\n${colorBash.yellow}And the following .env entries inside ${process.cwd() + "/.env"}:\n${
            colorBash.blueB
        }${envEntries.join("\n")}`
    );
}
