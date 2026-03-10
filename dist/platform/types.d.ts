/**
 * Platform abstraction layer — defines interfaces that each OS adapter must implement.
 *
 * macOS is the first target. Windows and Linux adapters can be added by implementing
 * the PlatformAdapter interface without changing any tool or server code.
 */
export interface ScreenshotResult {
    /** Base64-encoded image data */
    data: string;
    /** MIME type of the image (e.g. "image/png") */
    mimeType: string;
    /** Image width in pixels */
    width: number;
    /** Image height in pixels */
    height: number;
}
export type MouseButton = "left" | "right" | "middle";
export interface MouseClickOptions {
    x: number;
    y: number;
    button: MouseButton;
    clickCount: 1 | 2 | 3;
}
export interface MouseMoveOptions {
    x: number;
    y: number;
}
export interface MouseDragOptions {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    button: MouseButton;
}
export type KeyModifier = "command" | "control" | "option" | "shift" | "fn";
export interface KeyboardTypeOptions {
    text: string;
}
export interface KeyboardKeyOptions {
    /** Key name — e.g. "return", "tab", "escape", "a", "f5", "delete", "space" */
    key: string;
    /** Modifier keys held while pressing the key */
    modifiers: KeyModifier[];
}
export interface AppInfo {
    name: string;
    bundleId: string;
    pid: number;
    isActive: boolean;
}
export interface WindowInfo {
    id: number;
    title: string;
    appName: string;
    appPid: number;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    isMinimized: boolean;
    isFullscreen: boolean;
}
export interface UIElement {
    /** Accessibility role (e.g. "AXButton", "AXTextField", "AXMenuItem") */
    role: string;
    title: string | null;
    value: string | null;
    description: string | null;
    enabled: boolean;
    position: {
        x: number;
        y: number;
    } | null;
    size: {
        width: number;
        height: number;
    } | null;
    children: UIElement[];
}
export interface MenuBarItem {
    title: string;
    children: MenuItem[];
}
export interface MenuItem {
    title: string;
    enabled: boolean;
    shortcut: string | null;
    children: MenuItem[];
}
export interface PlatformAdapter {
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
//# sourceMappingURL=types.d.ts.map