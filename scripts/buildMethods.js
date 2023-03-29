import fs from 'fs/promises';

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
import { colorBash } from './util/util.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Before generating functions a list of all methods for X contract must be made to 
// Safely predict when overloaded function parameters for the contract instance must be used to
// correctly identify an overloaded method on a ethers.Contract instance.
// Store method count as contractName:methodIdentifier:INT where methodIdentifier == funcName
const preFxGeneratorMethodList = {}

/**
 * Builds all web3 methods per web3 contract
 * @param {String} ABIS Contract ABI JSON to build methods from 
 */
export async function buildMethods(ABIS) {

    // Sets all available methods for contractName within array on preFxGeneratorMethodList
    const parseForAllContractMethods = async (contractName, fxObj) => {
        return new Promise(res => {
            // If contract name doesn't exist, add it
            if (!preFxGeneratorMethodList[contractName]) { 
                preFxGeneratorMethodList[contractName] = {};
            }
            // If method name doesn't exit add it with count 1
            if (!preFxGeneratorMethodList[contractName][fxObj.name]) {
                preFxGeneratorMethodList[contractName][fxObj.name] = 1;
            } else {
                preFxGeneratorMethodList[contractName][fxObj.name] += 1;
            }
            res();
        })
    }

    const createFunctionString = ({ contractName, name, inputs, outputs, stateMutability, type }) => {

        let fx = ``;

        // Don't try to parse skipTypes
        const skipTypes = ['constructor', 'error', 'event', 'fallback', 'receive']
        if (skipTypes.indexOf(type) !== -1) {
            return [fx, ""];
        }

        let fxName = `${contractName}_${type}_${name}_${stateMutability}_IN${inputs.length}_OUT${outputs.length}`

        fx += `async function ${fxName}(`

        let paramRepeatCount = 1;
        const extractInputName = (inputName) => {
            return !inputName ? (() => {
                let name = "nameMissing" + "_" + paramRepeatCount;
                paramRepeatCount++;
                return name;
            })() : inputName;
        }

        // Construct deconstructable function parameters
        if (inputs.length > 0) {
            fx += `{`
        }
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            fx += `${extractInputName(input.name)}` // Use solidityType_paramName as layout for parameters
            if (i !== inputs.length - 1) { fx += ', '; } // Comma for each param 
        }
        if (inputs.length > 0) {
            fx += `}`
        }
        // Finish parameters and break into type declaration
        // Make sure to reset param repeat count for correct naming
        paramRepeatCount = 1;
        if (inputs.length > 0) {
            fx += `:{`
        }
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            // Replace any invalid JS Chars with text
            input.type = input.type.replace("[]", "array")
            // Add fx params -- Use same param name structure from above
            fx += `${extractInputName(input.name)}:types.${input.type}` // Use solidity type as type
            if (i !== inputs.length - 1) { fx += ', '; } // Comma for each param 
        }
        if (inputs.length > 0) {
            fx += `}`
        }
        // Close type declarations and break into function body
        fx += `):Promise<${stateMutability === 'view' ? "types.ContractReadMethodResponse" : "types.ContractWriteMethodResponse"}> {\n`
        //Add the function opener for corresponding contract type getter
        fx += `\ttry {\n`
        // Get the contract instance 
        let contractCallerString = stateMutability === 'view' ?
            `ethAdapter._getReadonlyContractInstance("${contractName}")`
            : `ethAdapter._getSignerContractInstance("${contractName}")`

        fx += `\t\tlet contractInstance = ${contractCallerString};`;

        // If function is overloaded, use overloaded accessor name, else just use the function name
        if (preFxGeneratorMethodList[contractName][name] > 1) {
            let verboseFxAccessor = name + "(";
            for (let i = 0; i < inputs.length; i++) {
                let input = inputs[i];
                verboseFxAccessor += `${extractInputName(input.type)}`
                if (i !== inputs.length - 1) { verboseFxAccessor += ','; } // Comma for each param 
            }
            // close accessor
            verboseFxAccessor += ")";
            console.log(`${colorBash.lblue}Overloaded function ${name} on ${contractName} detected, using verbose function name ${colorBash.lblueB}${verboseFxAccessor}`);
            fx += `\n\t\tconst response = await contractInstance["${verboseFxAccessor}"](`
        } else {
            fx += `\n\t\tconst response = await contractInstance["${name}"](`
        }

        // Add inputs to call -- Again reset paramrepeatercount
        paramRepeatCount = 1;
        for (let i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            fx += `${extractInputName(input.name)}`
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

        // Get preGeneratedContractMethod count
        for (let fxObj of contractABI) {
            // Parse all contract method names to provide overload detection in createFunctionString();
            await parseForAllContractMethods(contractName, fxObj)
        }

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

    // Add Methods
    for (let i = 0; i < contractMethodStrings.length; i++) {
        output += contractMethodStrings[i];
    }

    // Add methods object opener
    output += `export const contractMethods = {`;

    // Go through each contract and get the functions for exporting
    for (let i = 0; i < Object.keys(contractFxNamesForContract).length; i++) {
        let cName = Object.keys(contractFxNamesForContract)[i];

        // Add object for contractName
        output += `\n\t${cName}: {\n`

        // Add all fnames under each contractName for exporting
        let functionNamesArray = contractFxNamesForContract[cName];

        for (let i = 0; i < functionNamesArray.length; i++) {
            let fName = functionNamesArray[i];
            output += `\t\t${(fName.replace(cName + "_function_", ""))}:${fName}`
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
    // Add ethAdapter instance contractMethods assignment
    output += `\nethAdapter.contractMethods = contractMethods;`

    // Read and re-write ethHandler.ts w/ generated functions
    let ethAdapter = (await fs.readFile(__dirname + '/../src/adapter/ethAdapter.ts')).toString();

    // Replace entry string with generated methods
    output = ethAdapter.replace(`// !! GENERATED FUNCTIONS BELOW HERE`, output)
    // Replace the contractsMethods typing with the contractMethods typeof
    output = output.replace(`contractMethods: object;`, "contractMethods: typeof contractMethods");

    // Write it
    await fs.writeFile(__dirname + '/../src/adapter/customEthAdapter.ts', output, "utf8");

    console.log(`\n${colorBash.green}Contract Methods Successfully Parsed to ES6 Syntax at:\n${colorBash.cyan}${path.resolve(__dirname + '/../src/adapter/customEthAdapter.ts')}\n\x1B[0m`);

}