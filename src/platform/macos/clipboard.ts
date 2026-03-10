/**
 * macOS clipboard operations — uses pbpaste/osascript for read/write.
 */

import { exec } from "../../helpers/exec.js";
import type { ClipboardContents } from "../types.js";

export async function getClipboard(): Promise<ClipboardContents> {
  try {
    const { stdout } = await exec("pbpaste", []);
    return { text: stdout || null, hasImage: false, imageData: null };
  } catch {
    return { text: null, hasImage: false, imageData: null };
  }
}

export async function setClipboard(contents: ClipboardContents): Promise<void> {
  if (contents.text !== null) {
    const escaped = contents.text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    await exec("osascript", ["-e", `set the clipboard to "${escaped}"`]);
  }
}
