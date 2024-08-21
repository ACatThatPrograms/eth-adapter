#!/usr/bin/env node
import dotenv from "dotenv";
import { argv } from "process";
import { buildOnStart } from "../scripts/buildOnStart.js";
import { rl } from "../scripts/util/util.js";
import { spawn } from "child_process";
import { colorBash } from "../scripts/util/util.js";

const determineProcessToRun = () => {
    // Remove first two calls from arg stack
    let argVectors = [...argv];
    argVectors.shift();
    argVectors.shift();
    let cmd = argVectors[0];
    argVectors.shift();
    let args = [...argVectors];
    return [cmd, args];
};

// Setup .env & run buildOnStart()
dotenv.config();
let success = await buildOnStart();
console.log(`\n${colorBash.lcyan}Eth Pre-Start Transpilation (ethpst): Success? => ${success ? colorBash.greenB : colorBash.redB} ${success}${colorBash.reset}`);
rl.close();
if (success) {
    let [cmd, args] = determineProcessToRun();
    if (typeof cmd === 'undefined') {
        console.log(`\n${colorBash.cyan}No post ethpst command found. Add additional commands after "ethpst" to run them after the script. Such as "ethpst npm run build" ${colorBash.reset}\n`)
        process.exit();
    }
    console.log(`\n${colorBash.cyan}Resuming...${colorBash.reset}`)
    const procRunner= spawn(cmd, args)
    procRunner.stdout.on("data", (chunk) => {
        process.stdout.write(chunk)
    })
}