/**
 * Tool registration aggregator — registers all tools on an McpServer instance.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";

import { registerScreenshotTool } from "./screenshot.js";
import { registerMouseTools } from "./mouse.js";
import { registerKeyboardTools } from "./keyboard.js";
import { registerAccessibilityTools } from "./accessibility.js";
import { registerApplicationTools } from "./applications.js";
import { registerTerminalTools } from "./terminal.js";

export type ToolRegistrar = (
  server: McpServer,
  platform: PlatformAdapter,
) => void;

function normalizeBlockedTools(blockedTools: Iterable<string>): Set<string> {
  return new Set(
    [...blockedTools].map((tool) => tool.trim()).filter((tool) => tool.length > 0),
  );
}

function applyToolBlocking(server: McpServer, blockedTools: Set<string>): void {
  if (blockedTools.size === 0) {
    return;
  }

  const originalTool = server.tool.bind(server) as (...args: unknown[]) => unknown;
  const blockedTool = (
    name: string,
    ...rest: unknown[]
  ): ReturnType<McpServer["tool"]> => {
    if (blockedTools.has(name)) {
      return undefined as ReturnType<McpServer["tool"]>;
    }
    return originalTool(name, ...rest) as ReturnType<McpServer["tool"]>;
  };

  (server as { tool: McpServer["tool"] }).tool = blockedTool as McpServer["tool"];
}

/**
 * Register all Connector tools on the given MCP server.
 * Each tool delegates to the platform adapter for OS-specific implementation.
 */
export function registerTools(
  server: McpServer,
  platform: PlatformAdapter,
  additionalRegistrars: ToolRegistrar[] = [],
  blockedTools: Iterable<string> = [],
): void {
  applyToolBlocking(server, normalizeBlockedTools(blockedTools));

  if (platform.capabilities.screenshot) {
    registerScreenshotTool(server, platform);
  }
  if (platform.capabilities.mouse) {
    registerMouseTools(server, platform);
  }
  if (platform.capabilities.keyboard) {
    registerKeyboardTools(server, platform);
  }
  if (platform.capabilities.accessibility) {
    registerAccessibilityTools(server, platform);
  }
  if (platform.capabilities.applications) {
    registerApplicationTools(server, platform);
  }
  if (platform.capabilities.terminal) {
    registerTerminalTools(server, platform);
  }

  for (const register of additionalRegistrars) {
    register(server, platform);
  }
}
