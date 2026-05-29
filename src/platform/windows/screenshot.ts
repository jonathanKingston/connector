/**
 * Windows screen capture via PowerShell, System.Windows.Forms bounds, and System.Drawing PNG encode.
 */

import type { ScreenshotResult } from "../types.js";
import { runPowerShellScript } from "./powershell-run.js";

const SCREENSHOT_TIMEOUT_MS = 60_000;

/**
 * Parse width and height from a PNG file header (shared convention with macOS adapter).
 */
function parsePngDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24) {
    throw new Error("Invalid PNG: file too small to contain IHDR");
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

function buildCaptureScript(displayId: number | undefined): string {
  const idLiteral = displayId === undefined ? "$null" : String(Math.trunc(displayId));
  return `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$displayId = ${idLiteral}
$screens = [System.Windows.Forms.Screen]::AllScreens
if ($null -eq $displayId) {
  $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
} else {
  $idx = [int]$displayId - 1
  if ($idx -lt 0 -or $idx -ge $screens.Length) {
    throw [System.ArgumentException] "Invalid displayId: $displayId (there are $($screens.Length) display(s))"
  }
  $bounds = $screens[$idx].Bounds
}
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
try {
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)
  } finally {
    $graphics.Dispose()
  }
  $ms = New-Object System.IO.MemoryStream
  try {
    $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    [Convert]::ToBase64String($ms.ToArray())
  } finally {
    $ms.Dispose()
  }
} finally {
  $bitmap.Dispose()
}
`.trim();
}

export async function captureScreen(displayId?: number): Promise<ScreenshotResult> {
  const script = buildCaptureScript(displayId);
  const { stdout, stderr } = await runPowerShellScript(script, SCREENSHOT_TIMEOUT_MS);

  const data = stdout.replace(/\r?\n/g, "").trim();
  if (data.length === 0) {
    throw new Error(
      `Screenshot produced empty output${stderr.length > 0 ? ` (stderr: ${stderr.slice(0, 500)})` : ""}`,
    );
  }

  const buffer = Buffer.from(data, "base64");

  if (buffer.length < 8 || buffer[0] !== 0x89 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("Screenshot output was not a PNG");
  }

  const { width, height } = parsePngDimensions(buffer);

  return {
    data,
    mimeType: "image/png",
    width,
    height,
  };
}
