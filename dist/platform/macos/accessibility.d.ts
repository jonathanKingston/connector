/**
 * macOS accessibility tree inspection using System Events via osascript JXA.
 *
 * Provides:
 * - getAccessibilityTree: Recursively enumerate UI elements for a process
 * - getMenuBar: List all menu bar items and their sub-menus
 * - clickMenuItem: Navigate a menu path and click the target item
 */
import type { UIElement, MenuBarItem } from "../types.js";
export declare function getAccessibilityTree(pid: number, maxDepth?: number): Promise<UIElement>;
export declare function getMenuBar(pid: number): Promise<MenuBarItem[]>;
export declare function clickMenuItem(pid: number, menuPath: string[]): Promise<void>;
//# sourceMappingURL=accessibility.d.ts.map