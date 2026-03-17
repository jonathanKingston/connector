/**
 * External tool module loader.
 *
 * Lets deployers expose setup-specific tools in separate modules while keeping
 * the core MCP host unchanged.
 */

import { pathToFileURL } from "node:url";
import { isAbsolute, resolve } from "node:path";
import type { ToolRegistrar } from "./index.js";

type ExtensionModule = {
  default?: unknown;
  registerTools?: unknown;
};

function resolveModuleSpecifier(specifier: string): string {
  if (specifier.startsWith(".") || isAbsolute(specifier)) {
    return pathToFileURL(resolve(specifier)).href;
  }
  return specifier;
}

function pickRegistrar(moduleExports: ExtensionModule, specifier: string): ToolRegistrar {
  if (typeof moduleExports.registerTools === "function") {
    return moduleExports.registerTools as ToolRegistrar;
  }
  if (typeof moduleExports.default === "function") {
    return moduleExports.default as ToolRegistrar;
  }

  throw new Error(
    `Tool module "${specifier}" must export a register function as ` +
      "either named export `registerTools` or default export.",
  );
}

export async function loadExternalToolRegistrars(
  moduleSpecifiers: string[],
): Promise<ToolRegistrar[]> {
  const registrars: ToolRegistrar[] = [];

  for (const specifier of moduleSpecifiers) {
    const resolvedSpecifier = resolveModuleSpecifier(specifier);
    let moduleExports: ExtensionModule;

    try {
      moduleExports = (await import(resolvedSpecifier)) as ExtensionModule;
    } catch (error) {
      throw new Error(
        `Failed to load tool module "${specifier}": ${String(error)}`,
      );
    }

    registrars.push(pickRegistrar(moduleExports, specifier));
  }

  return registrars;
}
