/**
 * Run a PowerShell script block with Connector's standard strict / quiet preferences.
 */

import { Buffer } from "node:buffer";

import { connectorDebug } from "../../debug.js";
import { exec } from "../../helpers/exec.js";
import { getShutdownAbortSignal } from "../../shutdown.js";

const POWERSHELL_EXE = "powershell.exe";

function wrapScript(body: string): string {
  return (
    `$ProgressPreference = 'SilentlyContinue'\n` +
    `$ErrorActionPreference = 'Stop'\n` +
    body
  );
}

function toEncodedCommand(script: string): string {
  return Buffer.from(script, "utf16le").toString("base64");
}

export async function runPowerShellScript(
  body: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  connectorDebug("runPowerShellScript", {
    timeoutMs,
    bodyPreview: body.slice(0, 240),
  });

  const encoded = toEncodedCommand(wrapScript(body));

  const result = await exec(
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

  connectorDebug("runPowerShellScript done", {
    stdoutBytes: result.stdout.length,
    stderrBytes: result.stderr.length,
  });

  return result;
}
