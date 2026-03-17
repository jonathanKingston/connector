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

function createRegistrationServer(
  server: McpServer,
  blockedTools: Set<string>,
): McpServer {
  if (blockedTools.size === 0) {
    return server;
  }

  return new Proxy(server, {
    get(target, prop, receiver) {
      if (prop !== "tool") {
        return Reflect.get(target, prop, receiver);
      }

      const originalTool = target.tool.bind(target) as (
        ...args: unknown[]
      ) => unknown;
      return (name: string, ...rest: unknown[]) => {
        if (blockedTools.has(name)) {
          return undefined;
        }
        return originalTool(name, ...rest);
      };
    },
  }) as McpServer;
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
  const registrationServer = createRegistrationServer(
    server,
    normalizeBlockedTools(blockedTools),
  );

  if (platform.capabilities.screenshot) {
    registerScreenshotTool(registrationServer, platform);
  }
  if (platform.capabilities.mouse) {
    registerMouseTools(registrationServer, platform);
  }
  if (platform.capabilities.keyboard) {
    registerKeyboardTools(registrationServer, platform);
  }
  if (platform.capabilities.accessibility) {
    registerAccessibilityTools(registrationServer, platform);
  }
  if (platform.capabilities.applications) {
    registerApplicationTools(registrationServer, platform);
  }
  if (platform.capabilities.terminal) {
    registerTerminalTools(registrationServer, platform);
  }

  for (const register of additionalRegistrars) {
    register(registrationServer, platform);
  }
}
