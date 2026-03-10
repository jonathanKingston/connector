/**
 * File system tools — read, write, and list files and directories.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

export function registerFilesystemTools(server: McpServer, platform: PlatformAdapter): void {
  server.tool(
    "read_file",
    "Read a file from the filesystem. Returns the file contents as text (UTF-8) or base64 for binary files.",
    {
      path: z.string().describe("Absolute path to the file to read"),
      encoding: z.enum(["utf-8", "base64"]).default("utf-8").describe("Encoding for the file contents"),
    },
    async ({ path, encoding }) => {
      const result = await platform.readFile(path, encoding);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "write_file",
    "Write content to a file on the filesystem.",
    {
      path: z.string().describe("Absolute path to write the file"),
      content: z.string().describe("Content to write"),
      encoding: z.enum(["utf-8", "base64"]).default("utf-8").describe("Encoding of the content"),
    },
    async ({ path, content, encoding }) => {
      await platform.writeFile(path, content, encoding);
      return {
        content: [{ type: "text" as const, text: `Wrote ${content.length} characters to ${path}` }],
      };
    },
  );

  server.tool(
    "list_directory",
    "List files and directories at the given path.",
    {
      path: z.string().describe("Absolute path to the directory"),
    },
    async ({ path }) => {
      const entries = await platform.listDirectory(path);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(entries, null, 2) }],
      };
    },
  );
}
