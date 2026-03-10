import { describe, it, expect, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerWaitTools } from "../../src/tools/wait.js";
import { createMockPlatform } from "../helpers/mock-platform.js";

function getToolHandler(server: McpServer, toolName: string): (...args: any[]) => any {
  const s = server as any;
  const entry = s._registeredTools?.[toolName];
  if (entry?.handler) return entry.handler;
  if (entry?.callback) return entry.callback;
  throw new Error(`Could not find handler for tool: ${toolName}`);
}

describe("wait tools", () => {
  let server: McpServer;
  let platform: ReturnType<typeof createMockPlatform>;

  beforeEach(() => {
    platform = createMockPlatform();
    server = new McpServer({ name: "test", version: "0.0.1" });
    registerWaitTools(server, platform);
  });

  it("registers wait_for_element and wait_for_window tools", () => {
    const s = server as any;
    expect(s._registeredTools["wait_for_element"]).toBeDefined();
    expect(s._registeredTools["wait_for_window"]).toBeDefined();
  });

  describe("wait_for_element", () => {
    it("passes correct params to platform and returns element JSON", async () => {
      const handler = getToolHandler(server, "wait_for_element");

      const result = await handler({
        pid: 1234,
        role: "AXButton",
        titleContains: "OK",
        valueContains: undefined,
        timeout: 5000,
        interval: 250,
      });

      expect(platform.waitForElement).toHaveBeenCalledWith({
        pid: 1234,
        role: "AXButton",
        titleContains: "OK",
        valueContains: undefined,
        timeout: 5000,
        interval: 250,
      });

      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.role).toBe("AXButton");
      expect(parsed.title).toBe("OK");
    });

    it("returns timeout message when element not found", async () => {
      platform.waitForElement.mockResolvedValue(null);
      const handler = getToolHandler(server, "wait_for_element");

      const result = await handler({
        pid: 1234,
        timeout: 100,
        interval: 50,
      });

      expect(result.content[0].text).toBe("Timed out waiting for element");
    });
  });

  describe("wait_for_window", () => {
    it("passes correct params to platform and returns window JSON", async () => {
      const handler = getToolHandler(server, "wait_for_window");

      const result = await handler({
        titleContains: "New Document",
        timeout: 5000,
        interval: 250,
      });

      expect(platform.waitForWindow).toHaveBeenCalledWith({
        titleContains: "New Document",
        timeout: 5000,
        interval: 250,
      });

      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.title).toBe("New Document");
      expect(parsed.appName).toBe("TextEdit");
    });

    it("returns timeout message when window not found", async () => {
      platform.waitForWindow.mockResolvedValue(null);
      const handler = getToolHandler(server, "wait_for_window");

      const result = await handler({
        titleContains: "Nonexistent",
        timeout: 100,
        interval: 50,
      });

      expect(result.content[0].text).toBe("Timed out waiting for window");
    });
  });
});
