import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("filesystem tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  // ── read_file ──────────────────────────────────────────────────────────────

  it("read_file is listed in available tools", async () => {
    const { tools } = await ctx.client.listTools();
    const tool = tools.find((t) => t.name === "read_file");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Read a file");
  });

  it("read_file passes correct args and returns file contents", async () => {
    const result = await ctx.client.callTool({
      name: "read_file",
      arguments: { path: "/tmp/test.txt" },
    });

    expect(platform.readFile).toHaveBeenCalledWith("/tmp/test.txt", "utf-8");

    const textContent = (result.content as Array<{ type: string; text: string }>).find(
      (c) => c.type === "text",
    );
    expect(textContent).toBeDefined();
    const parsed = JSON.parse(textContent!.text);
    expect(parsed.content).toBe("file content");
    expect(parsed.encoding).toBe("utf-8");
    expect(parsed.size).toBe(12);
  });

  it("read_file passes base64 encoding when specified", async () => {
    await ctx.client.callTool({
      name: "read_file",
      arguments: { path: "/tmp/binary.bin", encoding: "base64" },
    });

    expect(platform.readFile).toHaveBeenCalledWith("/tmp/binary.bin", "base64");
  });

  // ── write_file ─────────────────────────────────────────────────────────────

  it("write_file is listed in available tools", async () => {
    const { tools } = await ctx.client.listTools();
    const tool = tools.find((t) => t.name === "write_file");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("Write content");
  });

  it("write_file passes correct args and returns confirmation", async () => {
    const result = await ctx.client.callTool({
      name: "write_file",
      arguments: { path: "/tmp/output.txt", content: "hello world" },
    });

    expect(platform.writeFile).toHaveBeenCalledWith("/tmp/output.txt", "hello world", "utf-8");

    const textContent = (result.content as Array<{ type: string; text: string }>).find(
      (c) => c.type === "text",
    );
    expect(textContent).toBeDefined();
    expect(textContent!.text).toContain("Wrote");
    expect(textContent!.text).toContain("/tmp/output.txt");
  });

  // ── list_directory ─────────────────────────────────────────────────────────

  it("list_directory is listed in available tools", async () => {
    const { tools } = await ctx.client.listTools();
    const tool = tools.find((t) => t.name === "list_directory");
    expect(tool).toBeDefined();
    expect(tool!.description).toContain("List files");
  });

  it("list_directory passes correct args and returns entries", async () => {
    const result = await ctx.client.callTool({
      name: "list_directory",
      arguments: { path: "/tmp" },
    });

    expect(platform.listDirectory).toHaveBeenCalledWith("/tmp");

    const textContent = (result.content as Array<{ type: string; text: string }>).find(
      (c) => c.type === "text",
    );
    expect(textContent).toBeDefined();
    const parsed = JSON.parse(textContent!.text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].name).toBe("test.txt");
    expect(parsed[0].type).toBe("file");
    expect(parsed[1].name).toBe("subdir");
    expect(parsed[1].type).toBe("directory");
  });
});
