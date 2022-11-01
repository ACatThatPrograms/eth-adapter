import fs from 'fs/promises';

// Es6 Path resolve
import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Builds all web3 methods per web3 contract
 * @param {String} ABIS Contract ABI JSON to build methods from 
 */
export async function buildMethods (ABIS) {

    const createContractOutline = (contractName) => ({
        name: contractName,
        methods: []
    })

    const createFunctionString = ({ contractName, name, inputs, outputs, stateMutability, type }) => {

        let fx = ``;

        // Don't try to parse skipTypes
        const skipTypes = ['constructor', 'error', 'event', 'fallback']
        if (skipTypes.indexOf(type) !== -1) {
            return [fx, ""];
        }

        let fxName = `${contractName}_${type}_${name}_${stateMutability}_IN${inputs.length}_OUT${outputs.length}`

        fx += `export async function ${fxName}(`

        // Construct deconstructable function parameters
        if (inputs.length > 0) {
            fx += `{`
        }
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            // Replace any invalid JS Chars with text
            input.type = input.type.replace("[]", "Array")
            // Add fx params
            fx += `${input.name}_${input.type}`
            if (i !== inputs.length - 1) { fx += ', '; } // Comma for each param 
        }
        if (inputs.length > 0) {
            fx += `}`
        }
        // Close parameters and break into function body
        fx += `) {\n`
        //Add the function opener for corresponding contract type getter
        fx += `\ttry {\n`
        // Get the contract instance 
        let contractCallerString = stateMutability === 'view' ?
            `getEthAdapter()._getReadonlyContractInstance("${contractName}")`
            : `getEthAdapter()._getSignerContractInstance("${contractName}")`

        fx += `\t\tlet contractInstance = ${contractCallerString};`;
        fx += `\n\t\tconst response = await contractInstance["${name}"](`
        // Add inputs to call
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            // if (input.name === "contractInstance") { continue } // Skip shimmed input
            fx += `${input.name}_${input.type}`
            if (i !== inputs.length - 1) { fx += ', '; } // Comma for each param 
        }
        // Close params
        fx += `);\n`;
        // Parse return
        fx += `\t\treturn response;`
        // Add closures
        fx += `\n\t}`
        // Add catch
        fx += ` catch(ex) { \n\t\treturn { error: ex.message }\n\t}`
        // Add final closure
        fx += `\n}\n`

        // Add params property for parsing into front-end components
        fx += `${fxName}.params = [`

        for (let i = 0; i < inputs.length; i++) {
            if (i === 0) { fx += '\n' }
            let input = inputs[i];
            // if (input.name === "contractInstance") { continue } // Skip shimmed input
            fx += `\t{name:"${input.name}",type:"${input.type}"}`
            if (i !== inputs.length - 1) { fx += ',\n'; } // Comma for each param 
        }

        if (inputs.length !== 0) {
            fx += '\n';
        }

        // Close array
        fx += `];\n\n`;

        return [fx, fxName];
    }

    const contractMethodStrings = [];
    const contractFxNamesForContract = {};

    for (let abiKEY in ABIS) {

        // Isolate contract name/abiKEY for ABIS object
        let contractName = abiKEY;
        let contractABI = JSON.parse(ABIS[abiKEY]);

        // Parse ABI for methods
        for (let fxObj of contractABI) {
            // Inject contractName to fxObject
            fxObj.contractName = contractName;
            let [fxString, fxName] = createFunctionString(fxObj);

            if (!fxName) { continue } // Skip if no fxName

            contractMethodStrings.push(fxString);

            if (contractFxNamesForContract[contractName]?.length) {
                contractFxNamesForContract[contractName].push(fxName);
            } else {
                contractFxNamesForContract[contractName] = [];
                contractFxNamesForContract[contractName].push(fxName);
            }

        }

    }


    // Setup final default export
    let output = ''

    // Add import ethHandler
    output += `import { getEthAdapter } from './ethAdapter.js';\n\n`

    // Add Methods
    for (let i = 0; i < contractMethodStrings.length; i++) {
        output += contractMethodStrings[i];
    }

    // Add methods object opener
    output += `const contractMethods = {`;

    // Go through each contract and get the functions for exporting
    for (let i = 0; i < Object.keys(contractFxNamesForContract).length; i++) {
        let cName = Object.keys(contractFxNamesForContract)[i];

        // Add object for contractName
        output += `\n\t${cName}: {\n`

        // Add all fnames under each contractName for exporting
        let functionNamesArray = contractFxNamesForContract[cName];

        for (let i = 0; i < functionNamesArray.length; i++) {
            let fName = functionNamesArray[i];
            output += `\t\t${(fName.replace(cName + "_function_", "")).replace(/_IN.*/, "")}:${fName}`
            if (i !== functionNamesArray.length - 1) {
                output += ',\n'
            }
        }

        // Close contract function object
        output += `\n\t}`

        // Add comma if needed
        if (i !== Object.keys(contractFxNamesForContract).length - 1) {
            output += ','
        }

    }

    // Add final object closure
    output += `\n}`

    // Add default export

    output += `\n\nexport default contractMethods;`

    await fs.writeFile(__dirname + '/../adapter/contractMethods.js', output, "utf8");

    console.log(`\n\x1B[0;32mFunctions Successfully Parsed to ES6 Syntax in ${__dirname}/../adapter/contractMethods.js\n\x1B[0m`);

}