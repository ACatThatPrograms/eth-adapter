#!/usr/bin/env node
import { generateDefaultConfig } from "../util/configHandling.js";
import { rl } from "../util/util.js";

main();

async function main() {
    await generateDefaultConfig();
    rl.close();
}
