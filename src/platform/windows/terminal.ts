/**
 * PowerShell-backed command execution for Windows.
 *
 * Uses -EncodedCommand (UTF-16 LE base64) so arbitrary user commands do not require
 * fragile shell quoting. Wraps with strict error preference for cmdlet failures.
 */

import { Buffer } from "node:buffer";

import { connectorDebug } from "../../debug.js";
import { exec } from "../../helpers/exec.js";
import { getShutdownAbortSignal } from "../../shutdown.js";
import {
  DEFAULT_TERMINAL_TIMEOUT_MS,
  type TerminalExecOptions,
  type TerminalExecResult,
} from "../types.js";

const POWERSHELL_EXE = "powershell.exe";

function wrapCommandForPowerShell(command: string): string {
  return (
    `$ProgressPreference = 'SilentlyContinue'\n` +
    `$ErrorActionPreference = 'Stop'\n` +
    command
  );
}

function toEncodedCommand(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

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

  const encoded = toEncodedCommand(wrapCommandForPowerShell(command));

  const { stdout, stderr } = await exec(
    POWERSHELL_EXE,
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encoded,
    ],
    timeoutMs,
    { signal: getShutdownAbortSignal() },
  );

  connectorDebug("terminalExec done", {
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
  });

  return { stdout, stderr };
}
