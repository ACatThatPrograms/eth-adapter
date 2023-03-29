#!/usr/bin/env node
import dotenv from "dotenv";
import { argv } from "process";
import { buildOnStart } from "../scripts/buildOnStart.js";
import { rl } from "../scripts/util/util.js";
import { exec } from "child_process";
import { colorBash } from "../scripts/util/util.js";

const determineProcessToRun = () => {
    // Remove first two calls from arg stack
    let argVectors = [...argv];
    argVectors.shift();
    argVectors.shift();
    let cmd = argVectors.join(" ");
    return cmd;
};

// Setup .env & run buildOnStart()
dotenv.config();
let success = await buildOnStart(true);
console.log(`\n${colorBash.lcyan}Eth Pre-Start Transpilation (ethpst): Success? => ${success ? colorBash.greenB : colorBash.redB} ${success}${colorBash.reset}`);
console.log(`\n${colorBash.cyan}Resuming...${colorBash.reset}`)
console.log();
rl.close();
if (success) {
    exec(determineProcessToRun(), (err, stdout) => {
        console.log("yep");
        console.log(err);
        console.log(stdout);
        process.stdout.write(stdout);
    });
}