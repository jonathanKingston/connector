import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createMockPlatform } from "../helpers/mock-platform.js";
import { createTestContext, type TestContext } from "../helpers/test-server.js";

describe("command tools", () => {
  let ctx: TestContext;
  const platform = createMockPlatform();

  beforeAll(async () => {
    ctx = await createTestContext(platform);
  });

  afterAll(async () => {
    await ctx.cleanup();
  });

  describe("run_command", () => {
    it("is listed in available tools", async () => {
      const { tools } = await ctx.client.listTools();
      expect(tools.find((t) => t.name === "run_command")).toBeDefined();
    });

    it("passes command and args to platform", async () => {
      await ctx.client.callTool({
        name: "run_command",
        arguments: { command: "ls", args: ["-la", "/tmp"] },
      });

      expect(platform.runCommand).toHaveBeenCalledWith("ls", ["-la", "/tmp"], {});
    });

    it("returns stdout/stderr/exitCode in response", async () => {
      platform.runCommand.mockResolvedValueOnce({
        stdout: "file1.txt\nfile2.txt\n",
        stderr: "",
        exitCode: 0,
        timedOut: false,
      });

      const result = await ctx.client.callTool({
        name: "run_command",
        arguments: { command: "ls" },
      });

      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      const parsed = JSON.parse(text);
      expect(parsed.exitCode).toBe(0);
      expect(parsed.timedOut).toBe(false);
      expect(parsed.stdout).toBe("file1.txt\nfile2.txt\n");
      expect(parsed.stderr).toBe("");
    });

    it("defaults args to empty array", async () => {
      await ctx.client.callTool({
        name: "run_command",
        arguments: { command: "whoami" },
      });

      expect(platform.runCommand).toHaveBeenCalledWith("whoami", [], {});
    });

    it("passes optional cwd and timeout params", async () => {
      await ctx.client.callTool({
        name: "run_command",
        arguments: { command: "ls", args: [], cwd: "/home", timeout: 5000 },
      });

      expect(platform.runCommand).toHaveBeenCalledWith("ls", [], { cwd: "/home", timeout: 5000 });
    });
  });
});
