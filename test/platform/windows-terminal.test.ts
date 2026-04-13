import { describe, it, expect } from "vitest";

import { terminalExec } from "../../src/platform/windows/terminal.js";

describe("Windows terminalExec", () => {
  it.runIf(process.platform === "win32")("runs PowerShell and returns stdout", async () => {
    const result = await terminalExec({ command: "Write-Output 'connector-test'" });
    expect(result.stdout).toContain("connector-test");
    expect(result.stderr).not.toContain("CLIXML");
  });
});
