import fs from 'fs/promises';
import { recurseForObjectKey } from '../util/util.js';

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {*} arg 
 */
export async function buildBytecodeFiles(arg) {
    const bytecodeFiles = await fs.readdir('./bytecode/');

    const byteCodes = {};

    for (const bytecodeFilename of bytecodeFiles) {
        const bytecodeFile = await fs.readFile('./bytecode/' + bytecodeFilename)
        const bytecodeFileAsJSON = JSON.parse(bytecodeFile.toString());
        // Find object key and write ES6 syntax .js file for it
        let bytecode = recurseForObjectKey(bytecodeFileAsJSON, "object");
        const contractName = bytecodeFilename.replace('.json', "").toUpperCase();
        byteCodes[contractName] = bytecode;
    }

    const es6Export = "const bytecodes = " + JSON.stringify(byteCodes) + "\nexport default bytecodes;";
    await fs.writeFile(__dirname + '/../src/adapter/bytecodes.js', es6Export, "utf8");

    console.log(`\x1B[0;32mBytecodes Successfully Parsed to ES6 Syntax in ${path.resolve(__dirname + /../adapter/bytecodes.js)}\n\x1B[0m`);

}