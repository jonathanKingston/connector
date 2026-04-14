import { z } from "zod";

function psString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function runPowerShell(platform, script, timeoutMs = 20_000) {
  const result = await platform.terminalExec({ command: script, timeoutMs });
  if (result.stderr && result.stderr.trim()) {
    throw new Error(result.stderr.trim());
  }
  return result.stdout.trim();
}

async function runJson(platform, script, timeoutMs = 20_000) {
  const stdout = await runPowerShell(platform, script, timeoutMs);
  return stdout ? JSON.parse(stdout) : null;
}

function windowApiScript() {
  return `
Add-Type @"
using System;
using System.Runtime.InteropServices;
public struct RECT {
  public int Left;
  public int Top;
  public int Right;
  public int Bottom;
}
public static class ConnectorUser32 {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
}
"@
`;
}

function buildWindowQuery({
  hwnd,
  pid,
  exactTitle,
  titleContains,
  visibleOnly = true,
}) {
  const filters = ["$_.MainWindowHandle -ne 0"];
  if (visibleOnly) {
    filters.push("$_.MainWindowTitle");
  }
  if (hwnd !== undefined) {
    filters.push(`$_.MainWindowHandle -eq ${Number(hwnd)}`);
  }
  if (pid !== undefined) {
    filters.push(`$_.Id -eq ${Number(pid)}`);
  }
  if (exactTitle) {
    filters.push(`$_.MainWindowTitle -eq ${psString(exactTitle)}`);
  }
  if (titleContains) {
    filters.push(`$_.MainWindowTitle -like ${psString(`*${titleContains}*`)}`);
  }
  return filters.join(" -and ");
}

function listWindowsScript(query) {
  return `
${windowApiScript()}
$foreground = [int64][ConnectorUser32]::GetForegroundWindow()
$windows = Get-Process | Where-Object { ${query} } | Sort-Object Id | ForEach-Object {
  $rect = New-Object RECT
  [ConnectorUser32]::GetWindowRect([IntPtr]::new($_.MainWindowHandle), [ref]$rect) | Out-Null
  [pscustomobject]@{
    id = [int64]$_.MainWindowHandle
    title = $_.MainWindowTitle
    appName = $_.ProcessName
    appPid = $_.Id
    bounds = @{
      x = $rect.Left
      y = $rect.Top
      width = ($rect.Right - $rect.Left)
      height = ($rect.Bottom - $rect.Top)
    }
    isMinimized = [ConnectorUser32]::IsIconic([IntPtr]::new($_.MainWindowHandle))
    isFullscreen = $false
    isForeground = ([int64]$_.MainWindowHandle -eq $foreground)
  }
}
$windows | ConvertTo-Json -Compress -Depth 5
`;
}

function activateWindowScript(query) {
  return `
${windowApiScript()}
$target = Get-Process | Where-Object { ${query} } | Select-Object -First 1
if (-not $target) {
  throw "No matching window found."
}
$handle = [IntPtr]::new($target.MainWindowHandle)
[ConnectorUser32]::ShowWindowAsync($handle, 5) | Out-Null
Start-Sleep -Milliseconds 200
[ConnectorUser32]::SetForegroundWindow($handle) | Out-Null
Start-Sleep -Milliseconds 250
$rect = New-Object RECT
[ConnectorUser32]::GetWindowRect($handle, [ref]$rect) | Out-Null
[pscustomobject]@{
  id = [int64]$target.MainWindowHandle
  title = $target.MainWindowTitle
  appName = $target.ProcessName
  appPid = $target.Id
  bounds = @{
    x = $rect.Left
    y = $rect.Top
    width = ($rect.Right - $rect.Left)
    height = ($rect.Bottom - $rect.Top)
  }
} | ConvertTo-Json -Compress -Depth 5
`;
}

function waitForWindowScript(query, timeoutMs, pollMs) {
  return `
$deadline = (Get-Date).AddMilliseconds(${timeoutMs})
while ((Get-Date) -lt $deadline) {
  $target = Get-Process | Where-Object { ${query} } | Select-Object -First 1
  if ($target) {
    [pscustomobject]@{
      id = [int64]$target.MainWindowHandle
      title = $target.MainWindowTitle
      appName = $target.ProcessName
      appPid = $target.Id
    } | ConvertTo-Json -Compress -Depth 4
    exit 0
  }
  Start-Sleep -Milliseconds ${pollMs}
}
throw "Timed out waiting for matching window."
`;
}

function sendKeysNotation(key, modifiers = []) {
  const modifierNotation = modifiers
    .map((modifier) => {
      switch (modifier) {
        case "control":
          return "^";
        case "shift":
          return "+";
        case "option":
        case "alt":
          return "%";
        case "command":
        case "fn":
          throw new Error(`${modifier} is not supported on Windows.`);
        default:
          throw new Error(`Unsupported modifier: ${modifier}`);
      }
    })
    .join("");

  const lower = key.toLowerCase();
  const namedKeys = {
    enter: "{ENTER}",
    return: "{ENTER}",
    tab: "{TAB}",
    escape: "{ESC}",
    esc: "{ESC}",
    backspace: "{BACKSPACE}",
    delete: "{DELETE}",
    del: "{DELETE}",
    space: " ",
    up: "{UP}",
    down: "{DOWN}",
    left: "{LEFT}",
    right: "{RIGHT}",
    home: "{HOME}",
    end: "{END}",
    pgup: "{PGUP}",
    pgdn: "{PGDN}",
  };

  let keyNotation = namedKeys[lower];
  if (!keyNotation) {
    if (/^f([1-9]|1[0-9]|20)$/.test(lower)) {
      keyNotation = `{${lower.toUpperCase()}}`;
    } else if (key.length === 1) {
      keyNotation = key.replace(/[+^%~(){}\[\]]/g, "{$&}");
    } else {
      throw new Error(`Unsupported key: ${key}`);
    }
  }
  return `${modifierNotation}${keyNotation}`;
}

function keyboardPrelude() {
  return `
Add-Type -AssemblyName System.Windows.Forms
`;
}

function sessionStatusScript() {
  return `
${windowApiScript()}
$current = Get-Process -Id $PID
$handle = [ConnectorUser32]::GetForegroundWindow()
$fgId = [int64]$handle
$foreground = $null
if ($fgId -ne 0) {
  $foreground = Get-Process | Where-Object { [int64]$_.MainWindowHandle -eq $fgId } | Select-Object -First 1
}
$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
[pscustomobject]@{
  pid = $current.Id
  sessionId = $current.SessionId
  processName = $current.ProcessName
  user = $identity.Name
  isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  foregroundWindow = if ($foreground) {
    @{
      id = [int64]$foreground.MainWindowHandle
      title = $foreground.MainWindowTitle
      processName = $foreground.ProcessName
      pid = $foreground.Id
    }
  } else {
    $null
  }
} | ConvertTo-Json -Compress -Depth 5
`;
}

export function registerTools(server, platform) {
  if (!platform.capabilities.terminal) {
    return;
  }

  server.tool(
    "windows_session_status",
    "Return Windows session diagnostics including current process/session, admin state, and current foreground window.",
    {},
    async () => {
      const data = await runJson(platform, sessionStatusScript());
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "windows_list_windows",
    "List top-level windows on Windows with title, pid, handle, bounds, minimized state, and foreground flag.",
    {
      visibleOnly: z
        .boolean()
        .default(true)
        .describe("If true, only return windows with a non-empty title."),
      titleContains: z
        .string()
        .optional()
        .describe("Optional substring filter on the window title."),
      pid: z.number().int().positive().optional().describe("Optional process id filter."),
    },
    async ({ visibleOnly, titleContains, pid }) => {
      const query = buildWindowQuery({ visibleOnly, titleContains, pid });
      const data = await runJson(platform, listWindowsScript(query));
      return {
        content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      };
    },
  );

  server.tool(
    "windows_activate_window",
    "Bring a top-level window to the foreground by handle, pid, exact title, or title substring.",
    {
      hwnd: z.number().int().positive().optional().describe("Exact window handle."),
      pid: z.number().int().positive().optional().describe("Process id owning the target window."),
      exactTitle: z.string().optional().describe("Exact window title match."),
      titleContains: z.string().optional().describe("Substring match on window title."),
    },
    async ({ hwnd, pid, exactTitle, titleContains }) => {
      const query = buildWindowQuery({ hwnd, pid, exactTitle, titleContains });
      const data = await runJson(platform, activateWindowScript(query));
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "windows_wait_for_window",
    "Wait for a top-level window to appear by pid, exact title, or title substring.",
    {
      pid: z.number().int().positive().optional().describe("Process id owning the target window."),
      exactTitle: z.string().optional().describe("Exact window title match."),
      titleContains: z.string().optional().describe("Substring match on window title."),
      timeoutMs: z.number().int().positive().default(15_000).describe("Maximum wait time."),
      pollMs: z.number().int().positive().default(250).describe("Polling interval."),
    },
    async ({ pid, exactTitle, titleContains, timeoutMs, pollMs }) => {
      const query = buildWindowQuery({ pid, exactTitle, titleContains });
      const data = await runJson(
        platform,
        waitForWindowScript(query, timeoutMs, pollMs),
        timeoutMs + 2_000,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      };
    },
  );

  server.tool(
    "windows_keyboard_type",
    "Type text into the active window. Defaults to clipboard paste for reliability on Windows.",
    {
      text: z.string().describe("Text to type or paste into the active window."),
      useClipboard: z
        .boolean()
        .default(true)
        .describe("If true, copy to clipboard and send Ctrl+V instead of raw SendKeys."),
    },
    async ({ text, useClipboard }) => {
      const script = useClipboard
        ? `
${keyboardPrelude()}
Set-Clipboard -Value ${psString(text)}
[System.Windows.Forms.SendKeys]::SendWait('^v')
`
        : `
${keyboardPrelude()}
[System.Windows.Forms.SendKeys]::SendWait(${psString(text.replace(/[+^%~(){}\[\]]/g, "{$&}"))})
`;
      await runPowerShell(platform, script);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { ok: true, mode: useClipboard ? "clipboard" : "sendkeys", length: text.length },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "windows_keyboard_key",
    "Press a key with optional modifiers in the active window.",
    {
      key: z.string().min(1).describe("Key name such as enter, tab, escape, l, f5, left."),
      modifiers: z
        .array(z.enum(["control", "shift", "alt", "option", "command", "fn"]))
        .default([])
        .describe("Modifier keys to hold while pressing the key."),
    },
    async ({ key, modifiers }) => {
      const notation = sendKeysNotation(key, modifiers);
      const script = `
${keyboardPrelude()}
[System.Windows.Forms.SendKeys]::SendWait(${psString(notation)})
`;
      await runPowerShell(platform, script);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, key, modifiers, notation }, null, 2),
          },
        ],
      };
    },
  );
}
