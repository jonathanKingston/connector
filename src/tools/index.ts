/**
 * Tool registration aggregator — registers all tools on an McpServer instance.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PlatformAdapter } from "../platform/types.js";
import type { ToolGroup } from "../tool-groups.js";

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

export interface RegisterToolsOptions {
  /**
   * Which built-in groups to register (intersected with platform capabilities).
   * Default `"all"` — used by tests and programmatic callers that want full registration.
   */
  enabledToolGroups?: Set<ToolGroup> | "all";
}

/**
 * Register Connector tools on the given MCP server.
 * Each tool delegates to the platform adapter for OS-specific implementation.
 */
export function registerTools(
  server: McpServer,
  platform: PlatformAdapter,
  additionalRegistrars: ToolRegistrar[] = [],
  options: RegisterToolsOptions = {},
): void {
  const selection = options.enabledToolGroups ?? "all";

  const allow = (group: ToolGroup): boolean => {
    if (selection === "all") return true;
    return selection.has(group);
  };

  if (allow("screenshot") && platform.capabilities.screenshot) {
    registerScreenshotTool(server, platform);
  }
  if (allow("mouse") && platform.capabilities.mouse) {
    registerMouseTools(server, platform);
  }
  if (allow("keyboard") && platform.capabilities.keyboard) {
    registerKeyboardTools(server, platform);
  }
  if (allow("accessibility") && platform.capabilities.accessibility) {
    registerAccessibilityTools(server, platform);
  }
  if (allow("applications") && platform.capabilities.applications) {
    registerApplicationTools(server, platform);
  }
  if (allow("terminal") && platform.capabilities.terminal) {
    registerTerminalTools(server, platform);
  }

  for (const register of additionalRegistrars) {
    register(server, platform);
  }
}
