import { ethers } from "ethers";
import { configFileName } from "./const.js";
import { colorBash, readArtifactsDirectory, writeProcessCwdFile } from "./util.js";
import { rl } from "./util.js";
import { readFile } from "fs/promises";

const defaultConfig = {
    alwaysCompile: false, // Should eth-adapter skip the artifact hash check?
    promptForUpdateOnArtifactChange: false, // When artifacts change, should prompt ask for configuration update? False will always update with 0x0
    hashes: {
        artifacts: "0x0",
        config: "0x0",
    },
};

/**
 * Return configuration as a JSON string
 */
export async function getConfigAsString() {
    return JSON.stringify(await loadConfig());
}

/**
 * Generate default config file, allow passive to be passed to just generate without read line interuptions
 */
export const generateDefaultConfig = async (passive) => {
    // Read artifacts for estimating required needs
    let artifactFiles = await readArtifactsDirectory();
    const newConfig = { ...defaultConfig }; // Clone default config in for set-up
    if (!artifactFiles) {
        console.log(`
            \n\x1B[36mNo artifacts detected; You should add contract artifacts to /artifacts prior to running \x1B[33mnpx ethinit\x1B[33m
        `);
    }
    // Inject artifactFiles contract name skeleton and request addresses if necessary
    let invCount = 0;
    const askForAddress = async (filename, wasWrong = false) => {
        let address = await rl.question(
            `\n${
                wasWrong ? `Invalid address (Attempt ${invCount}/2) => ` : ""
            }\x1B[0;34mWhat is the address for ${filename}?: `
        );
        if (ethers.utils.isAddress(address)) {
            invCount = 0;
            return address;
        } else {
            if (invCount >= 2) {
                console.log(
                    `\x1B[0;33m\nSetting ${filename} address as 0x0 -- You can upate it later in ${configFileName}`
                );
                return "0x0";
            }
            invCount++;
            return await askForAddress(filename, true);
        }
    };
    // Write the file
    await writeConfigFile(newConfig);
    console.log(
        `\n\x1B[0;32mSuccessfully wrote new config file to ${process.cwd() + "/" + configFileName} ${
            !requestAddresses
                ? "\n\n\x1B[1;33mRemember to fill out the contract addresses in the newly created file before running the transpiler\n"
                : "\n"
        }`
    );
    return newConfig;
};

export const writeConfigFile = async (newConfigAsObject) => {
    await writeProcessCwdFile(configFileName, JSON.stringify(newConfigAsObject, false, 2));
};

let configMissingWarningIssued = false;

export const loadConfig = async () => {
    try {
        let ethAdapterConfig = JSON.parse((await readFile(process.cwd() + "/" + configFileName)).toString());
        return ethAdapterConfig;
    } catch (ex) {
        if (ex.code === "ERR_MODULE_NOT_FOUND" || ex.message.indexOf("no such file") !== -1) {
            if (!configMissingWarningIssued) {
                console.log(
                    `\x1B[36mNo eth-adapter config found, a default config named "eth-adapter.config.json will be created\x1B[33m`
                );
                configMissingWarningIssued = true;
            }
            return false;
        } else {
            console.log("Loading eth-adapter config error:");
            throw new Error(ex);
        }
    }
};
