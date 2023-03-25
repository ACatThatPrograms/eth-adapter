#!/usr/bin/env node
import { generateDefaultConfig } from "../scripts/configHandling.js";
import { rl } from "../scripts/util.js";

main();

async function main() {
    await generateDefaultConfig();
    rl.close();
}
