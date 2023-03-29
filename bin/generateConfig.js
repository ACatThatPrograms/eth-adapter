#!/usr/bin/env node
import { generateDefaultConfig } from "../scripts/util/configHandling.js";
import { rl } from "../scripts/util/util.js";

main();

async function main() {
    await generateDefaultConfig();
    rl.close();
}
