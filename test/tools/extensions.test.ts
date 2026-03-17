import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import { loadExternalToolRegistrars } from "../../src/tools/extensions.js";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("external tool modules", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    const registrars = await loadExternalToolRegistrars([
      resolve(process.cwd(), "test/fixtures/tool-modules/named-register.mjs"),
      resolve(process.cwd(), "test/fixtures/tool-modules/terminal-command-exposure.mjs"),
    ]);
    ctx = await createTestContext(platform, registrars);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  it("loads and registers tools from external modules", async () => {
    const { tools } = await ctx.client.listTools();
    expect(tools.find((tool) => tool.name === "custom_ping")).toBeDefined();
    expect(tools.find((tool) => tool.name === "shell_command_exec")).toBeDefined();
  });

  it("can expose terminal commands via external module", async () => {
    await ctx.client.callTool({
      name: "shell_command_exec",
      arguments: {
        command: ["echo", "hello world"],
        directory: "/tmp/workspace",
        timeoutSec: 12,
      },
    });

    expect(platform.terminalExec).toHaveBeenCalledWith({
      command: "cd '/tmp/workspace' && 'echo' 'hello world'",
      timeoutMs: 12_000,
    });
  });

  it("throws if module does not export a registrar function", async () => {
    await expect(
      loadExternalToolRegistrars([
        resolve(process.cwd(), "test/fixtures/tool-modules/invalid.mjs"),
      ]),
    ).rejects.toThrow("must export a register function");
  });
});
