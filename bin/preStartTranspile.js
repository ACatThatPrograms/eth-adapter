#!/usr/bin/env node
import dotenv from 'dotenv'
import { buildOnStart } from "../scripts/buildOnStart.js";

// Setup .env & run buildOnStart()
dotenv.config();
buildOnStart(true);