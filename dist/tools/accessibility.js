/**
 * Accessibility inspection tools — UI element tree, menu bar, and menu item clicking.
 */
import { z } from "zod";
export function registerAccessibilityTools(server, platform) {
    // ── get_accessibility_tree ──────────────────────────────────────────────
    server.tool("get_accessibility_tree", "Get the accessibility UI element tree for a running application. Returns a hierarchical JSON structure of UI elements including their roles, titles, values, positions, and sizes. Use list_applications first to find the PID.", {
        pid: z
            .number()
            .int()
            .positive()
            .describe("Process ID of the application to inspect"),
        maxDepth: z
            .number()
            .int()
            .positive()
            .default(3)
            .describe("Maximum depth to traverse the UI tree (default 3). Higher values give more detail but take longer."),
    }, async ({ pid, maxDepth }) => {
        const tree = await platform.getAccessibilityTree(pid, maxDepth);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(tree, null, 2),
                },
            ],
        };
    });
    // ── get_menu_bar ────────────────────────────────────────────────────────
    server.tool("get_menu_bar", "Get the menu bar structure for a running application. Returns all menu items including sub-menus, enabled state, and keyboard shortcuts. Use list_applications first to find the PID.", {
        pid: z
            .number()
            .int()
            .positive()
            .describe("Process ID of the application to inspect"),
    }, async ({ pid }) => {
        const menuBar = await platform.getMenuBar(pid);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(menuBar, null, 2),
                },
            ],
        };
    });
    // ── click_menu_item ─────────────────────────────────────────────────────
    server.tool("click_menu_item", 'Click a menu item by navigating through the menu path. For example, to click File → Save As…, pass menuPath: ["File", "Save As…"]. Use get_menu_bar first to discover available menu items.', {
        pid: z
            .number()
            .int()
            .positive()
            .describe("Process ID of the application"),
        menuPath: z
            .array(z.string().min(1))
            .min(1)
            .describe('Path through the menu hierarchy. e.g. ["File", "Save As…"] or ["Edit", "Find", "Find…"]'),
    }, async ({ pid, menuPath }) => {
        await platform.clickMenuItem(pid, menuPath);
        return {
            content: [
                {
                    type: "text",
                    text: `Clicked menu item: ${menuPath.join(" → ")}`,
                },
            ],
        };
    });
}
//# sourceMappingURL=accessibility.js.map