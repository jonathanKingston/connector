/**
 * Linux terminal execution for terminal-only environments.
 */

import { connectorDebug } from "../../debug.js";
import { exec } from "../../helpers/exec.js";
import type { TerminalExecOptions, TerminalExecResult } from "../types.js";

const BASH_PATH = "/bin/bash";
const STRICT_SHELL_PREFIX = "set -euo pipefail; ";
const DEFAULT_TERMINAL_TIMEOUT_MS = 60_000;

export async function terminalExec(
  options: TerminalExecOptions,
): Promise<TerminalExecResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TERMINAL_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`Invalid timeoutMs: ${timeoutMs}. Expected a positive integer.`);
  }

  const command = options.command.trim();
  if (command.length === 0) {
    throw new Error("Command cannot be empty.");
  }

  connectorDebug("terminalExec", { timeoutMs, command });

  const { stdout, stderr } = await exec(
    BASH_PATH,
    ["-lc", `${STRICT_SHELL_PREFIX}${command}`],
    timeoutMs,
  );

  connectorDebug("terminalExec done", {
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
  });

  return { stdout, stderr };
}
