/**
 * macOS screen capture using the built-in `screencapture` command.
 */

import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { exec } from "../../helpers/exec.js";
import type { ScreenshotResult } from "../types.js";

/**
 * Parse width and height from a PNG file header.
 * PNG IHDR chunk: bytes 16-19 = width, bytes 20-23 = height (big-endian uint32).
 */
function parsePngDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 24) {
    throw new Error("Invalid PNG: file too small to contain IHDR");
  }
  // PNG signature is 8 bytes, then IHDR chunk starts at byte 8
  // IHDR chunk: 4 bytes length + 4 bytes "IHDR" + 4 bytes width + 4 bytes height
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

export async function captureScreen(displayId?: number): Promise<ScreenshotResult> {
  const tempPath = join(tmpdir(), `connector-screenshot-${randomUUID()}.png`);

  try {
    const args = ["-x", "-t", "png"];

    if (displayId !== undefined) {
      args.push("-D", String(displayId));
    }

    args.push(tempPath);

    await exec("/usr/sbin/screencapture", args);

    const buffer = await readFile(tempPath);
    const { width, height } = parsePngDimensions(buffer);
    const data = buffer.toString("base64");

    return {
      data,
      mimeType: "image/png",
      width,
      height,
    };
  } finally {
    // Clean up temp file — ignore errors if it doesn't exist
    await unlink(tempPath).catch(() => {});
  }
}
