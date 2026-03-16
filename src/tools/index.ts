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

/**
 * Register all Connector tools on the given MCP server.
 * Each tool delegates to the platform adapter for OS-specific implementation.
 */
export function registerTools(
  server: McpServer,
  platform: PlatformAdapter,
): void {
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
}
