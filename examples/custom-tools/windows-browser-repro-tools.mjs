import { z } from "zod";

const DEFAULT_BROWSER_EXE = "C:\\Users\\jonat\\ep2-x64-run\\DuckDuckGoBrowser.exe";
const DEFAULT_RUNTIME_DIR = "C:\\Users\\jonat\\ep2-x64-run\\WebView2Runtime";
const DEFAULT_USER_DATA_DIR = "C:\\Users\\jonat\\ep2-x64-run\\UserData";
const DEFAULT_PROFILE_TEMP_DIR = "$env:TEMP\\DuckDuckGoBrowser";

function jsonText(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

async function runPowerShell(platform, script, timeoutMs = 30_000) {
  return platform.terminalExec({
    command: script,
    timeoutMs,
  });
}

export function registerTools(server, platform) {
  if (!platform.capabilities.terminal) {
    return;
  }

  server.tool(
    "windows_reset_ddg_browser_state",
    "Kill DuckDuckGoBrowser/calc, clear the staged browser UserData dir and temp profile state, and report the resulting paths. Use before each fresh repro run.",
    {
      browserExePath: z
        .string()
        .default(DEFAULT_BROWSER_EXE)
        .describe("Full path to DuckDuckGoBrowser.exe"),
      userDataDir: z
        .string()
        .default(DEFAULT_USER_DATA_DIR)
        .describe("Explicit WebView2 user-data directory to remove"),
      profileTempDir: z
        .string()
        .default(DEFAULT_PROFILE_TEMP_DIR)
        .describe("Temp profile directory to remove"),
    },
    async ({ browserExePath, userDataDir, profileTempDir }) => {
      const script = `
$ErrorActionPreference = 'Stop'
$browserExePath = '${browserExePath.replace(/'/g, "''")}'
$userDataDir = "${userDataDir.replace(/"/g, '""')}"
$profileTempDir = "${profileTempDir.replace(/"/g, '""')}"

Get-Process DuckDuckGoBrowser,calc -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $userDataDir -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $profileTempDir -ErrorAction SilentlyContinue

[pscustomobject]@{
  browserExePath = $browserExePath
  userDataDirExists = Test-Path $userDataDir
  profileTempDirExists = Test-Path $profileTempDir
} | ConvertTo-Json -Compress
`;
      const result = await runPowerShell(platform, script, 45_000);
      return jsonText({
        stdout: result.stdout,
        stderr: result.stderr,
      });
    },
  );

  server.tool(
    "windows_launch_ddg_browser",
    "Launch the staged DuckDuckGo browser with explicit bundled WebView2 runtime variables and optional startup URL. Returns PID and command line.",
    {
      browserExePath: z
        .string()
        .default(DEFAULT_BROWSER_EXE)
        .describe("Full path to DuckDuckGoBrowser.exe"),
      runtimeDir: z
        .string()
        .default(DEFAULT_RUNTIME_DIR)
        .describe("Bundled WebView2 runtime directory"),
      userDataDir: z
        .string()
        .default(DEFAULT_USER_DATA_DIR)
        .describe("Explicit WebView2 user-data directory"),
      additionalBrowserArguments: z
        .string()
        .default(
          "--allow-insecure-localhost --ignore-certificate-errors --allow-running-insecure-content",
        )
        .describe("Value for WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS"),
      startupUrl: z
        .string()
        .optional()
        .describe("Optional startup URL to pass on the command line"),
    },
    async ({
      browserExePath,
      runtimeDir,
      userDataDir,
      additionalBrowserArguments,
      startupUrl,
    }) => {
      const escapedArgs = startupUrl
        ? `'${startupUrl.replace(/'/g, "''")}'`
        : "";
      const script = `
$ErrorActionPreference = 'Stop'
$env:WEBVIEW2_BROWSER_EXECUTABLE_FOLDER = '${runtimeDir.replace(/'/g, "''")}'
$env:WEBVIEW2_USER_DATA_FOLDER = '${userDataDir.replace(/'/g, "''")}'
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = '${additionalBrowserArguments.replace(/'/g, "''")}'

$p = Start-Process -FilePath '${browserExePath.replace(/'/g, "''")}' ${
        startupUrl ? `-ArgumentList ${escapedArgs}` : ""
      } -WorkingDirectory '${browserExePath
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "''")
        .replace(/\\\\DuckDuckGoBrowser.exe$/, "")}' -PassThru
Start-Sleep -Seconds 2
$proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($p.Id)"
[pscustomobject]@{
  pid = $p.Id
  commandLine = $proc.CommandLine
  executablePath = $proc.ExecutablePath
} | ConvertTo-Json -Compress
`;
      const result = await runPowerShell(platform, script, 30_000);
      return jsonText({
        stdout: result.stdout,
        stderr: result.stderr,
      });
    },
  );

  server.tool(
    "windows_navigate_ddg_browser",
    "Activate the DuckDuckGoBrowser main window by PID, focus the address bar, paste a URL from the clipboard, and press Enter. Use after a clean launch when command-line URL handling is unreliable.",
    {
      pid: z.number().int().positive().describe("DuckDuckGoBrowser PID to target"),
      url: z.string().min(1).describe("URL to navigate to"),
      waitMs: z
        .number()
        .int()
        .positive()
        .max(60_000)
        .default(12_000)
        .describe("How long to wait after pressing Enter before returning"),
    },
    async ({ pid, url, waitMs }) => {
      const script = `
$ErrorActionPreference = 'Stop'
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win32 {
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
Add-Type -AssemblyName System.Windows.Forms

$proc = Get-Process -Id ${pid} -ErrorAction Stop
$h = [IntPtr]::new($proc.MainWindowHandle)
if ($h -eq [IntPtr]::Zero) {
  throw "Process ${pid} has no main window handle"
}
[Win32]::ShowWindowAsync($h, 5) | Out-Null
Start-Sleep -Milliseconds 300
[Win32]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 500
Set-Clipboard '${url.replace(/'/g, "''")}'
[System.Windows.Forms.SendKeys]::SendWait('^l')
Start-Sleep -Milliseconds 350
[System.Windows.Forms.SendKeys]::SendWait('^v')
Start-Sleep -Milliseconds 200
[System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
Start-Sleep -Milliseconds ${waitMs}

$updated = Get-Process -Id ${pid} -ErrorAction Stop
[pscustomobject]@{
  pid = $updated.Id
  mainWindowTitle = $updated.MainWindowTitle
  mainWindowHandle = $updated.MainWindowHandle
  navigatedUrl = '${url.replace(/'/g, "''")}'
} | ConvertTo-Json -Compress
`;
      const result = await runPowerShell(platform, script, waitMs + 15_000);
      return jsonText({
        stdout: result.stdout,
        stderr: result.stderr,
      });
    },
  );
}
