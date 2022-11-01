import fs from 'fs/promises';
import { recurseForObjectKey } from '../util/util.js';

// Es6 Path resolve
import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Builds all ABI files, and additionally places extracted contract names in their respective config file for intellisense to work properly on CONTRACT_NAMES.
 * @param {*} arg 
 */
export async function buildAbiAndContractNameFiles(arg) {
    
    const AbiFiles = await fs.readdir('./artifacts/');

    const ABIS = {};
    const CONTRACT_NAMES = {};

    for (const abiFileName of AbiFiles) {
        const abiFile = await fs.readFile('./artifacts/' + abiFileName)
        const abiFileAsJSON = JSON.parse(abiFile.toString());
        // Find ABI and write ES6 syntax .js file for it
        const abi = (!Array.isArray(abiFileAsJSON)) ? recurseForObjectKey(abiFileAsJSON, "abi") : abiFileAsJSON;
        const abiObj = abi;
        const abiJson = JSON.stringify(abiObj);
        const contractName = abiFileName.replace('.json', "").toUpperCase();
        ABIS[contractName] = abiJson;
        CONTRACT_NAMES[contractName] = contractName;
    }

    const AbiES6Export = "const abis = " + JSON.stringify(ABIS) + "\nexport default abis;";
    await fs.writeFile(__dirname + '/../adapter/abis.js', AbiES6Export, "utf8");

    const contractNamesES6 = "const CONTRACT_NAMES = " + JSON.stringify(CONTRACT_NAMES) + "\nexport default CONTRACT_NAMES;";
    await fs.writeFile(__dirname + '/../adapter/contractNames.js', contractNamesES6, "utf8");

    console.log(`\x1B[0;32mABIs and CONTRACT_NAMES Successfully Parsed to ES6 Syntax in ${__dirname}/../adapter/contract_names.js\n\x1B[0m`);

    return ABIS;

}

// Only run automatically on start from terminal
if (process.argv[2] === 'run') {
    module.exports.buildAbiAndContractNameFiles(process.argv[2])
}