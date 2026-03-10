/**
 * macOS platform adapter — delegates to individual module implementations.
 */
import type { PlatformAdapter, ScreenshotResult, MouseClickOptions, MouseMoveOptions, MouseDragOptions, KeyboardTypeOptions, KeyboardKeyOptions, AppInfo, WindowInfo, UIElement, MenuBarItem } from "../types.js";
export declare class MacOSAdapter implements PlatformAdapter {
    captureScreen(displayId?: number): Promise<ScreenshotResult>;
    mouseClick(options: MouseClickOptions): Promise<void>;
    mouseMove(options: MouseMoveOptions): Promise<void>;
    mouseDrag(options: MouseDragOptions): Promise<void>;
    keyboardType(options: KeyboardTypeOptions): Promise<void>;
    keyboardKey(options: KeyboardKeyOptions): Promise<void>;
    listApplications(): Promise<AppInfo[]>;
    activateApplication(bundleIdOrName: string): Promise<void>;
    listWindows(): Promise<WindowInfo[]>;
    getAccessibilityTree(pid: number, maxDepth?: number): Promise<UIElement>;
    getMenuBar(pid: number): Promise<MenuBarItem[]>;
    clickMenuItem(pid: number, menuPath: string[]): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map