/**
 * PowerShell-backed command execution for Windows.
 *
 * Uses -EncodedCommand (UTF-16 LE base64) so arbitrary user commands do not require
 * fragile shell quoting. Wraps with strict error preference for cmdlet failures.
 */

import { connectorDebug } from "../../debug.js";
import {
  DEFAULT_TERMINAL_TIMEOUT_MS,
  type TerminalExecOptions,
  type TerminalExecResult,
} from "../types.js";
import { runPowerShellScript } from "./powershell-run.js";

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

  const { stdout, stderr } = await runPowerShellScript(command, timeoutMs);

  connectorDebug("terminalExec done", {
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
  });

  return { stdout, stderr };
}
