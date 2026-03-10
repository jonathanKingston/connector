import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("alert tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("get_alerts", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "get_alerts")).toBeDefined();
    });

    it("returns alerts as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "get_alerts",
        arguments: {},
      });

      expect(platform.getAlerts).toHaveBeenCalled();

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].appName).toBe("Safari");
      expect(parsed[0].title).toBe("Save Changes?");
      expect(parsed[0].buttons).toEqual(["Save", "Don't Save", "Cancel"]);
    });
  });

  describe("get_notifications", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "get_notifications")).toBeDefined();
    });

    it("returns notifications as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "get_notifications",
        arguments: {},
      });

      expect(platform.getNotifications).toHaveBeenCalled();

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].appName).toBe("Mail");
      expect(parsed[0].title).toBe("New Message");
      expect(parsed[0].message).toBe("You have a new email");
      expect(parsed[0].timestamp).toBe("2025-01-01T00:00:00.000Z");
    });
  });
});
