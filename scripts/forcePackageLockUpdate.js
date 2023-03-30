import { readFile, writeFile } from "fs/promises";
import { lockfileBinEthIncrementorName } from "./util/const.js";
import { colorBash } from "./util/util.js";

/**
 * Webpack will not recompile unless package.json, package-lock.json, or yarn.lock changes
 * We can force this by adding a new bin to the lock entry for eth-adapter when any depedency using webpack is detected
 * It will cause a slow rebuild of the package but is the only option for on the fly transpilation to be detected
 */
export async function determineForcePackageLockUpdate(ethAdapterConfig) {

    // First we need to check for yarn.lock or package.lock
    let lockfileObj = await findLockFile();
    // Determine if lockfile has webpack dependency
    let webpackIsDep = determineIsWebpackDependency(lockfileObj);
    
    if (webpackIsDep) {
        console.log(`\n${colorBash.BG_red } WEBPACK Found ${colorBash.lblue} ${lockfileObj.type === "yarn" ? "yarn.lock" : "package-lock.json"}${colorBash.blue} will be used for force re-building webpack cache on new transpiles`)
        updateLockEntry(lockfileObj)
    }

}

async function findLockFile() {

    let yarnLock = false;
    let packageLock = false;

    try {
        packageLock = await readFile(process.cwd() + "/package-lock.json");
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw ex
        }
    }

    try {
        yarnLock = await readFile(process.cwd() + "/yarn.lock");
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw ex;
        }
    }

    if (packageLock && yarnLock) {
        console.log(`${colorBash.redB} Both package-lock.json and yarn.lock found!`)
        throw new Error("Dual lock files found, choose only 1")
    }

    return {
        data: JSON.parse(yarnLock ? yarnLock : packageLock),
        type: yarnLock ? "yarn" : "package"
    }

}

async function determineIsWebpackDependency(lockfileObj) {
    let packages = Object.keys(lockfileObj.data.packages);
    let webPackIdx = packages.indexOf("node_modules/webpack");
    if (webPackIdx !== -1) {
        return true;
    }
    return false;
}

async function updateLockEntry(lockfileObj) {

    let newLockEntry = {...lockfileObj.data}
    let ethAdapterBinEntry = lockfileObj.data.packages["node_modules/eth-adapter"].bin;
    let hasEthForceCompileIncrementor = !!ethAdapterBinEntry[lockfileBinEthIncrementorName];
    
    if (hasEthForceCompileIncrementor) {
        let newIncrementor = parseInt(
            newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName]
        ) + 1;
        newIncrementor = newIncrementor === 10 ? 1 : newIncrementor;
        newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName] = String(newIncrementor);
    } else {
        newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName] = "1";
    }

    await writeFile(process.cwd() + '/' + lockfileObj.type === "yarn" ? "yarn.lock" : "package-lock.json", Buffer.from(JSON.stringify(newLockEntry, false, 2)));

}