/**
 * File system operations — uses Node.js fs, works on all platforms.
 */

import { readFile as fsReadFile, writeFile as fsWriteFile, readdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import type { FileContents, DirectoryEntry } from "../types.js";

export async function readFile(path: string, encoding: "utf-8" | "base64" = "utf-8"): Promise<FileContents> {
  const buffer = await fsReadFile(path);
  const content = encoding === "base64" ? buffer.toString("base64") : buffer.toString("utf-8");
  return { content, encoding, size: buffer.length };
}

export async function writeFile(path: string, content: string, encoding: "utf-8" | "base64" = "utf-8"): Promise<void> {
  const buffer = encoding === "base64" ? Buffer.from(content, "base64") : Buffer.from(content, "utf-8");
  await fsWriteFile(path, buffer);
}

export async function listDirectory(path: string): Promise<DirectoryEntry[]> {
  const entries = await readdir(path, { withFileTypes: true });
  const results: DirectoryEntry[] = [];
  for (const entry of entries) {
    const fullPath = join(path, entry.name);
    const stats = await lstat(fullPath);
    let type: "file" | "directory" | "symlink" = "file";
    if (entry.isDirectory()) type = "directory";
    else if (entry.isSymbolicLink()) type = "symlink";
    results.push({
      name: entry.name,
      type,
      size: stats.size,
      modified: stats.mtime.toISOString(),
    });
  }
  return results;
}
