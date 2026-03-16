import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("terminal tools", () => {
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
    expect(tools.find((t) => t.name === "terminal_exec")).toBeDefined();
  });

  it("executes command and returns stdout/stderr", async () => {
    platform.terminalExec.mockResolvedValueOnce({
      stdout: "hello\n",
      stderr: "",
    });

    const result = await ctx.client.callTool({
      name: "terminal_exec",
      arguments: { command: "echo hello" },
    });

    expect(platform.terminalExec).toHaveBeenCalledWith({
      command: "echo hello",
      timeoutMs: 60_000,
    });

    const textContent = (result.content as Array<{ type: string; text?: string }>).find(
      (c) => c.type === "text",
    );
    expect(textContent?.text).toContain('"stdout": "hello\\n"');
  });
});
