/**
 * Bash-backed command execution for platform adapters (macOS, Linux).
 */

import { connectorDebug } from "../debug.js";
import { exec } from "../helpers/exec.js";
import { getShutdownAbortSignal } from "../shutdown.js";
import {
  DEFAULT_TERMINAL_TIMEOUT_MS,
  type TerminalExecOptions,
  type TerminalExecResult,
} from "./types.js";

const BASH_PATH = "/bin/bash";
const STRICT_SHELL_PREFIX = "set -euo pipefail; ";

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
    { signal: getShutdownAbortSignal() },
  );

  connectorDebug("terminalExec done", {
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
  });

  return { stdout, stderr };
}
