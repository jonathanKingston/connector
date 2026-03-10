import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("application tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("list_applications", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "list_applications")).toBeDefined();
    });

    it("returns running applications as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "list_applications",
        arguments: {},
      });

      expect(platform.listApplications).toHaveBeenCalled();

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe("Safari");
      expect(parsed[0].pid).toBe(1234);
    });
  });

  describe("list_windows", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "list_windows")).toBeDefined();
    });

    it("returns window list as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "list_windows",
        arguments: {},
      });

      expect(platform.listWindows).toHaveBeenCalled();

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed[0].title).toBe("Apple - Start");
      expect(parsed[0].bounds.width).toBe(1440);
    });
  });

  describe("activate_application", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "activate_application")).toBeDefined();
    });

    it("activates by name", async () => {
      const result = await ctx.client.callTool({
        name: "activate_application",
        arguments: { target: "Safari" },
      });

      expect(platform.activateApplication).toHaveBeenCalledWith("Safari");

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("Safari");
    });

    it("activates by bundle ID", async () => {
      await ctx.client.callTool({
        name: "activate_application",
        arguments: { target: "com.apple.Safari" },
      });

      expect(platform.activateApplication).toHaveBeenCalledWith("com.apple.Safari");
    });
  });
});
