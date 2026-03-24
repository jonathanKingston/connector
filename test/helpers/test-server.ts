/**
 * Test helper to create a connected MCP client+server pair for tool testing.
 *
 * Uses InMemoryTransport so tests run without any network or OS dependency.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  registerTools,
  type RegisterToolsOptions,
  type ToolRegistrar,
} from "../../src/tools/index.js";
import type { PlatformAdapter } from "../../src/platform/types.js";

export interface TestContext {
  client: Client;
  server: McpServer;
  cleanup: () => Promise<void>;
}

export async function createTestContext(
  platform: PlatformAdapter,
  additionalRegistrars: ToolRegistrar[] = [],
  registerOptions: RegisterToolsOptions = {},
): Promise<TestContext> {
  const server = new McpServer({
    name: "connector-test",
    version: "0.0.1",
  });

  registerTools(server, platform, additionalRegistrars, registerOptions);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({
    name: "test-client",
    version: "0.0.1",
  });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  return {
    client,
    server,
    cleanup: async () => {
      await client.close();
      await server.close();
    },
  };
}
