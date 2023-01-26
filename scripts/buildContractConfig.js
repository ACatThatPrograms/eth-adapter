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