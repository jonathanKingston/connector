import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("mouse tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("mouse_click", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "mouse_click")).toBeDefined();
    });

    it("clicks at coordinates with default button and count", async () => {
      const result = await ctx.client.callTool({
        name: "mouse_click",
        arguments: { x: 100, y: 200 },
      });

      expect(platform.mouseClick).toHaveBeenCalledWith({
        x: 100,
        y: 200,
        button: "left",
        clickCount: 1,
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("100");
      expect(text).toContain("200");
    });

    it("supports right click with double click", async () => {
      await ctx.client.callTool({
        name: "mouse_click",
        arguments: { x: 50, y: 75, button: "right", clickCount: 2 },
      });

      expect(platform.mouseClick).toHaveBeenCalledWith({
        x: 50,
        y: 75,
        button: "right",
        clickCount: 2,
      });
    });
  });

  describe("mouse_move", () => {
    it("moves to coordinates", async () => {
      const result = await ctx.client.callTool({
        name: "mouse_move",
        arguments: { x: 300, y: 400 },
      });

      expect(platform.mouseMove).toHaveBeenCalledWith({ x: 300, y: 400 });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("300");
      expect(text).toContain("400");
    });
  });

  describe("mouse_drag", () => {
    it("drags from start to end with default button", async () => {
      const result = await ctx.client.callTool({
        name: "mouse_drag",
        arguments: { startX: 10, startY: 20, endX: 100, endY: 200 },
      });

      expect(platform.mouseDrag).toHaveBeenCalledWith({
        startX: 10,
        startY: 20,
        endX: 100,
        endY: 200,
        button: "left",
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("10");
      expect(text).toContain("100");
    });
  });

  describe("mouse_scroll", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "mouse_scroll")).toBeDefined();
    });

    it("scrolls vertically with deltaY only", async () => {
      const result = await ctx.client.callTool({
        name: "mouse_scroll",
        arguments: { x: 500, y: 300, deltaY: 5 },
      });

      expect(platform.mouseScroll).toHaveBeenCalledWith({
        x: 500,
        y: 300,
        deltaX: 0,
        deltaY: 5,
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("500");
      expect(text).toContain("300");
    });

    it("scrolls horizontally with deltaX only", async () => {
      await ctx.client.callTool({
        name: "mouse_scroll",
        arguments: { x: 200, y: 150, deltaX: -3 },
      });

      expect(platform.mouseScroll).toHaveBeenCalledWith({
        x: 200,
        y: 150,
        deltaX: -3,
        deltaY: 0,
      });
    });

    it("passes all params to platform", async () => {
      await ctx.client.callTool({
        name: "mouse_scroll",
        arguments: { x: 100, y: 200, deltaX: 2, deltaY: -4 },
      });

      expect(platform.mouseScroll).toHaveBeenCalledWith({
        x: 100,
        y: 200,
        deltaX: 2,
        deltaY: -4,
      });
    });
  });
});
