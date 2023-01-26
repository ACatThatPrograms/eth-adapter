// Grab ES6 compiled ABIs, and contract names
import abis from './_abis.js';
import contractNames from './_contractNames.js';

import fs from 'fs/promises';

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ENUM KV for contract names and addresses, used to identify contracts throughout the application
export const CONTRACT_NAMES = contractNames;
export const CONTRACT_ADDRESSES = {};
export const CONTRACT_ABIS = {};

// Simplified access to all contract data
export const CONTRACTS = {};

export async function buildContractConfig() {
    // Extract names from process.env
    for (let environmentKey of Object.keys(process.env)) {
        // Only parse _CONTRACT_ADDRESS keys for the contract names
        if (environmentKey.indexOf("CONTRACT_ADDRESS") !== -1) {
            let contractName = environmentKey.replace("_CONTRACT_ADDRESS", "").replace("CONTRACT_ADDRESS", "").replace("REACT_APP__", "").replace("REACT_APP_", "").toUpperCase();
            // console.log(`\n\x1B[0;32mCorrecting  Config Successfully Parsed to ES6 Syntax in ${path.resolve(__dirname + '/../src/adapter/config.ts')}\n\x1B[0m`);
            // If file derived contract name does not exist, this means a user did not name .env KEYs the same as the artifacts/FILENAMES -- They must match
            if (!contractNames[contractName]) {
                console.warn(`\n\x1B[1;33mCritical Contract Config Issue -- Please Read Below -- ETHPST will most likely fail.\x1B[0m`);
                console.warn(`\n\x1B[0;33mContract Name Derrived from './artifacts/CONTRACTNAME.json' !== Contract Name Derrived from environment (Name From ENV = ${contractName}).\nWhen given artifacts/FILENAME.json, FILENAME should equal the enviroment key for the respective contract address entry.\ne.g. For artifact 'MyContract.json' the ENV entry should be MYCONTRACT_CONTRACT_ADDRESS=0x0.\nThis warning can also throw if you have an inbalance of artifact files to .env key entries -- make sure they match! If you have 4 Artifact files you should have 4 respective enviroment keys:value pairs.\x1B[0m`);
            }
            CONTRACT_NAMES[contractName] = contractName;
            CONTRACT_ADDRESSES[contractName] = process.env[environmentKey];
            try {
                CONTRACT_ABIS[contractName] = JSON.parse(abis[contractName]);
            } catch (ex) {
                console.error(`\n\x1B[0;31mCould not parse ABI into CONTRACT_ABIS[contractName] where contractName == ${contractName} and JSON.parse(abis[contractName]) was attempted -- Verify generated abi file at ${path.resolve(__dirname + '/../src/adapter/abis.ts')} has an entry for ${contractName}\n\x1B[0m`);
                throw new Error("Critical Eth-Adapter Compiling Error Encountered -- See Above Message")
            }
            CONTRACTS[contractName] = {
                name: contractName,
                address: process.env[environmentKey],
                abi: JSON.parse(abis[contractName]),
            }
        }
    }
    // Construct ES6 syntax config
    let output = `const CONTRACT_CONFIG = ${JSON.stringify(CONTRACTS)};`;
    output += `\nexport default CONTRACT_CONFIG;`;
    await fs.writeFile(__dirname + '/../src/adapter/config.ts', output, "utf8");
    console.log(`\n\x1B[0;32mContract Config Successfully Parsed to ES6 Syntax in ${path.resolve(__dirname + '/../src/adapter/config.ts')}\n\x1B[0m`);
}