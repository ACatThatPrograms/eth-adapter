#!/usr/bin/env node
import dotenv from "dotenv";
import { argv } from "process";
import { buildOnStart } from "../scripts/buildOnStart.js";
import { rl } from "../scripts/util.js";
import { exec } from "child_process";

const determinProcessToRun = () => {
    // Remove first two calls from arg stack
    let argVectors = [...argv];
    argVectors.shift();
    argVectors.shift();
    let cmd = argVectors.join(" ");
    return cmd;
};

// Setup .env & run buildOnStart()
dotenv.config();
await buildOnStart(true);
rl.close();
exec(determinProcessToRun(), (err, stdout) => {
    process.stdout.write(stdout);
});
