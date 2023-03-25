import fs from "fs/promises";
import { artifactsDirectory, artifactsHashFileName, configFileName } from "./const.js";
import { stdin as input, stdout as output } from 'node:process';
import * as readline from 'node:readline/promises';

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
