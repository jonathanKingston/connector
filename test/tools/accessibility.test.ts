import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("accessibility tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("get_accessibility_tree", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "get_accessibility_tree")).toBeDefined();
    });

    it("returns the accessibility tree as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "get_accessibility_tree",
        arguments: { pid: 1234 },
      });

      expect(platform.getAccessibilityTree).toHaveBeenCalledWith(1234, 3);

      const content = result.content as Array<{ type: string; text: string }>;
      expect(content).toHaveLength(1);
      expect(content[0].type).toBe("text");

      const parsed = JSON.parse(content[0].text);
      expect(parsed.role).toBe("AXApplication");
      expect(parsed.children).toHaveLength(1);
    });

    it("passes custom maxDepth", async () => {
      await ctx.client.callTool({
        name: "get_accessibility_tree",
        arguments: { pid: 1234, maxDepth: 5 },
      });

      expect(platform.getAccessibilityTree).toHaveBeenCalledWith(1234, 5);
    });
  });

  describe("get_menu_bar", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "get_menu_bar")).toBeDefined();
    });

    it("returns menu bar structure as JSON text", async () => {
      const result = await ctx.client.callTool({
        name: "get_menu_bar",
        arguments: { pid: 1234 },
      });

      expect(platform.getMenuBar).toHaveBeenCalledWith(1234);

      const content = result.content as Array<{ type: string; text: string }>;
      const parsed = JSON.parse(content[0].text);
      expect(parsed).toBeInstanceOf(Array);
      expect(parsed[0].title).toBe("File");
      expect(parsed[0].children).toHaveLength(2);
    });
  });

  describe("click_menu_item", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "click_menu_item")).toBeDefined();
    });

    it("clicks a menu item by path", async () => {
      const result = await ctx.client.callTool({
        name: "click_menu_item",
        arguments: { pid: 1234, menuPath: ["File", "New Window"] },
      });

      expect(platform.clickMenuItem).toHaveBeenCalledWith(1234, [
        "File",
        "New Window",
      ]);

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("File");
      expect(text).toContain("New Window");
    });
  });
});
