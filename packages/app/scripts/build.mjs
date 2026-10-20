#!/usr/bin/env node
/**
 * Build wrapper: runs `tsc -b` then `vite build` without forwarding any extra
 * CLI flags (e.g. `--prod`) that the caller may pass. Vite builds in production
 * mode by default, so no flag is needed.
 */
import { execSync } from "node:child_process";

const opts = { stdio: "inherit", cwd: new URL("..", import.meta.url) };
execSync("tsc -b", opts);
execSync("vite build", opts);
