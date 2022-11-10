import fs from 'fs/promises';
import { recurseForObjectKey } from '../util/util.js';

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

/**
 * Builds all ABI files, and additionally places extracted contract names in their respective config file for intellisense to work properly on CONTRACT_NAMES.
 * @param {*} arg 
 */
export async function buildAbiAndContractNameFiles(arg) {

    const AbiFiles = await fs.readdir('./artifacts/');

    const ABIS = {};
    const CONTRACT_NAMES = {};

    let errList = [];

    for (const abiFileName of AbiFiles) {
        try {
            process.stdout.write(`\x1B[0;36mAttempting Parse of ${process.cwd() + '/artifacts/' + abiFileName}...`);
            await sleeper(500);
            const abiFile = await fs.readFile(process.cwd() + '/artifacts/' + abiFileName)
            const abiFileAsString = abiFile.toString();
            const abiFileAsJSON = JSON.parse(abiFileAsString);
            // Find ABI and write ES6 syntax .js file for it
            const abi = (!Array.isArray(abiFileAsJSON)) ? recurseForObjectKey(abiFileAsJSON, "abi") : abiFileAsJSON;
            const abiObj = abi;
            const abiJson = JSON.stringify(abiObj);
            const contractName = abiFileName.replace('.json', "").toUpperCase();
            ABIS[contractName] = abiJson;
            CONTRACT_NAMES[contractName] = contractName;
            process.stdout.write("\x1B[1;32m SUCCESS\n\x1B[0m\n")
        } catch (ex) {
            process.stdout.write("\x1B[1;31m FAIL\n\x1B[0m\n");
            errList.push(ex.message);
        }
    }

    if (errList.length > 0) {
        errList.forEach(msg => {
            console.error('\n' + msg + '\n');
        })
    }

    // Write Names && ABIS locally for use in scrips as JS as well
    const AbiES6Export = "const abis = " + JSON.stringify(ABIS) + "\nexport default abis;";
    await fs.writeFile(__dirname + '/../src/adapter/abis.ts', AbiES6Export, "utf8");
    await fs.writeFile(__dirname + '/_abis.js', AbiES6Export, "utf8");

    const contractNamesES6 = "const CONTRACT_NAMES = " + JSON.stringify(CONTRACT_NAMES) + "\nexport default CONTRACT_NAMES;";
    await fs.writeFile(__dirname + '/../src/adapter/contractNames.ts', contractNamesES6, "utf8");
    await fs.writeFile(__dirname + '/_contractNames.js', contractNamesES6, "utf8");

    console.log(`\x1B[0;32mABIs and CONTRACT_NAMES Successfully Parsed to ES6 Syntax in ${__dirname}/../src/adapter/contract_names.ts\n\x1B[0m`);

    return ABIS;

}

// Only run automatically on start from terminal
if (process.argv[2] === 'run') {
    module.exports.buildAbiAndContractNameFiles(process.argv[2])
}