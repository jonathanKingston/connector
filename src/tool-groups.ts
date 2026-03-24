/**
 * Built-in tool groups — opt-in via CONNECTOR_TOOLS (see loadConfig).
 */

export const TOOL_GROUPS = [
  "screenshot",
  "mouse",
  "keyboard",
  "accessibility",
  "applications",
  "terminal",
] as const;

export type ToolGroup = (typeof TOOL_GROUPS)[number];

/** `CONNECTOR_TOOLS=all` expands to these groups (terminal is separate). */
export const TOOL_GROUPS_FOR_ALL_SHORTHAND = TOOL_GROUPS.filter(
  (g): g is ToolGroup => g !== "terminal",
);

export function isToolGroup(value: string): value is ToolGroup {
  return (TOOL_GROUPS as readonly string[]).includes(value);
}

/**
 * Parse CONNECTOR_TOOLS. Empty / unset → no built-in tools (opt-in).
 * Token `all` (case-insensitive) → every group **except** `terminal` (shell access is opt-in).
 * Combine `all,terminal` to enable every group including `terminal`.
 */
export function parseConnectorToolsEnv(raw: string | undefined): Set<ToolGroup> {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return new Set();
  }

  const set = new Set<ToolGroup>();
  for (const part of trimmed.split(",")) {
    const token = part.trim().toLowerCase();
    if (!token) continue;
    if (token === "all") {
      for (const g of TOOL_GROUPS_FOR_ALL_SHORTHAND) {
        set.add(g);
      }
      continue;
    }
    if (!isToolGroup(token)) {
      throw new Error(
        `CONNECTOR_TOOLS: unknown "${part.trim()}". ` +
          `Use comma-separated names: ${TOOL_GROUPS.join(", ")}, or all (all except terminal; add ,terminal for shell).`,
      );
    }
    set.add(token);
  }
  return set;
}
