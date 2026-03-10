import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("system tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("get_system_info", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      const tool = tools.find((t) => t.name === "get_system_info");
      expect(tool).toBeDefined();
      expect(tool!.description).toContain("system information");
    });

    it("returns system info JSON", async () => {
      const result = await ctx.client.callTool({ name: "get_system_info", arguments: {} });
      expect(result.content).toHaveLength(1);

      const textContent = (result.content as Array<{ type: string; text: string }>)[0];
      expect(textContent.type).toBe("text");

      const info = JSON.parse(textContent.text);
      expect(info.os).toBe("macOS");
      expect(info.osVersion).toBe("15.0");
      expect(info.hostname).toBe("test-mac");
      expect(info.username).toBe("testuser");
      expect(info.uptime).toBe(86400);
      expect(info.screenResolution).toEqual({ width: 3840, height: 2160 });
      expect(info.isScreenLocked).toBe(false);
      expect(info.batteryState).toEqual({ level: 85, isCharging: false, isPluggedIn: true });

      expect(platform.getSystemInfo).toHaveBeenCalled();
    });
  });

  describe("health_check", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      const tool = tools.find((t) => t.name === "health_check");
      expect(tool).toBeDefined();
      expect(tool!.description).toContain("health check");
    });

    it("returns health check JSON", async () => {
      const result = await ctx.client.callTool({ name: "health_check", arguments: {} });
      expect(result.content).toHaveLength(1);

      const textContent = (result.content as Array<{ type: string; text: string }>)[0];
      expect(textContent.type).toBe("text");

      const health = JSON.parse(textContent.text);
      expect(health.status).toBe("ok");
      expect(health.timestamp).toBe("2025-01-01T00:00:00.000Z");
      expect(health.latencyMs).toBe(42);

      expect(platform.healthCheck).toHaveBeenCalled();
    });
  });
});
