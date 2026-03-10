import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("extract_text tool", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("is listed in available tools", async () => {
    const { tools } = await ctx.client.listTools();
    const tool = tools.find((t) => t.name === "extract_text");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("OCR");
  });

  it("returns OCR results as JSON", async () => {
    const result = await ctx.client.callTool({ name: "extract_text", arguments: {} });
    expect(result.content).toHaveLength(1);

    const textContent = (result.content as Array<{ type: string; text: string }>).find(
      (c) => c.type === "text",
    );
    expect(textContent).toBeDefined();

    const parsed = JSON.parse(textContent!.text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe("Hello World");
    expect(parsed[0].confidence).toBe(0.98);
    expect(parsed[0].bounds).toEqual({ x: 100, y: 200, width: 200, height: 30 });
  });

  it("passes options to platform adapter", async () => {
    await ctx.client.callTool({
      name: "extract_text",
      arguments: {
        displayId: 2,
        regionX: 10,
        regionY: 20,
        regionWidth: 300,
        regionHeight: 400,
        languages: ["en-US"],
      },
    });

    expect(platform.extractText).toHaveBeenCalledWith({
      displayId: 2,
      region: { x: 10, y: 20, width: 300, height: 400 },
      languages: ["en-US"],
    });
  });
});
