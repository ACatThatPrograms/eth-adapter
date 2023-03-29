import fs from "fs/promises";
import { artifactsDirectory, artifactsHashFileName, configFileName } from "./const.js";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";

/**
 *
 * @param {Object} obj - Object to parse
 * @param {String} keyname - Keyname to search for
 * @returns
 */
export function recurseForObjectKey(obj, keyname) {
    let foundKeyVals = {};
    const recurse = (obj) => {
        if (!obj) {
            return {};
        }
        for (let key of Object.keys(obj)) {
            // Found ABI
            if (key === keyname) {
                foundKeyVals = obj[key];
            }
            // If not ABI, try and recurse
            if (typeof obj[key] === "object") {
                recurse(obj[key]);
            } else {
                continue;
            }
        }
    };
    recurse(obj);
    return foundKeyVals;
}

export const colorBash = {
    blue: `\x1B[0;34m`,
    blueB: `\x1B[1;34m`,
    cyan: `\x1B[0;36m`,
    cyanB: `\x1B[1;36m`,
    green: `\x1B[0;32m`,
    greenB: `\x1B[1;32m`,
    magenta: `\x1B[0;35m`,
    magentaB: `\x1B[1;35m`,
    lblue: `\x1B[0;94m`,
    lblueB: `\x1B[1;94m`,
    lcyan: `\x1B[0;96m`,
    lcyanB: `\x1B[1;96m`,
    lred: `\x1B[0;91m`,
    lredB: `\x1B[1;91m`,
    red: `\x1B[0;31m`,
    redB: `\x1B[1;31m`,
    yellow: `\x1B[0;33m`,
    yellowB: `\x1B[1;33m`,
    BG_yellow: `\x1B[0;43m`,
    BG_yellowB: `\x1B[1;43m`,
    BG_red: `\x1B[0;41m`,
    BG_redB: `\x1B[1;41m`,
    reset: `\x1B[0m`,
};

export const rl = readline.createInterface({ input, output });

/**
 * Read and return the artifacts files from the artifacts directory
 * Return false if not available
 */
export const readArtifactsDirectory = async () => {
    return await readProcessCwdDirectory(artifactsDirectory);
};

/**
 * Read and return the eth-adapter config file from the config file
 * Return false if not available
 */
export const readConfigFromFile = async () => {
    return await readProcessCwdFile(configFileName);
};

/**
 * Read and return the artifacts hash from the artifactsHash file
 * Return false if not available
 */
export const readArtifactsHashFromFile = async () => {
    let artifactsHash = await readProcessCwdFile(artifactsHashFileName);
    console.log(artifactsHash);
};

/**
 * @param {*} fileToRead - File location to read relative to process.cwd()
 */
async function readProcessCwdFile(fileToRead) {
    try {
        let file = await fs.readFile(process.cwd() + "/" + fileToRead);
        return file;
    } catch (ex) {
        if (ex.message.indexOf("no fuch file") !== -1) {
            throw new Error(ex);
        }
        return false;
    }
}

/**
 * @param {*} fileToRead - Dir location to read relative to process.cwd()
 */
async function readProcessCwdDirectory(dirToRead) {
    try {
        let file = await fs.readdir(process.cwd() + "/" + dirToRead);
        return file;
    } catch (ex) {
        if (ex.message.indexOf("no fuch file") !== -1) {
            throw new Error(ex);
        }
        return false;
    }
}

export async function writeProcessCwdFile(filename, data) {
    try {
        await fs.writeFile(process.cwd() + "/" + filename, Buffer.from(data));
    } catch (ex) {
        throw new Error(ex);
    }
}
