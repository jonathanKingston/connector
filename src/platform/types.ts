/**
 * Platform abstraction layer — defines interfaces that each OS adapter must implement.
 *
 * macOS is the first target. Windows and Linux adapters can be added by implementing
 * the PlatformAdapter interface without changing any tool or server code.
 */

// ── Screen ──────────────────────────────────────────────────────────────────

export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

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

// ── Mouse ───────────────────────────────────────────────────────────────────

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

export interface MouseScrollOptions {
  x: number;
  y: number;
  deltaX: number; // horizontal scroll (positive = right)
  deltaY: number; // vertical scroll (positive = down)
}

// ── Keyboard ────────────────────────────────────────────────────────────────

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

// ── Applications ────────────────────────────────────────────────────────────

export interface AppInfo {
  name: string;
  bundleId: string;
  pid: number;
  isActive: boolean;
}

// ── Windows ─────────────────────────────────────────────────────────────────

export interface WindowInfo {
  id: number;
  title: string;
  appName: string;
  appPid: number;
  bounds: { x: number; y: number; width: number; height: number };
  isMinimized: boolean;
  isFullscreen: boolean;
}

// ── Accessibility ───────────────────────────────────────────────────────────

export interface UIElement {
  /** Accessibility role (e.g. "AXButton", "AXTextField", "AXMenuItem") */
  role: string;
  title: string | null;
  value: string | null;
  description: string | null;
  enabled: boolean;
  position: { x: number; y: number } | null;
  size: { width: number; height: number } | null;
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

// ── Clipboard ──────────────────────────────────────────────────────────────

export interface ClipboardContents {
  text: string | null;
  hasImage: boolean;
  imageData: string | null; // base64 PNG if hasImage
}

// ── File System ────────────────────────────────────────────────────────────

export interface FileContents {
  content: string;
  encoding: string;
  size: number;
}

export interface DirectoryEntry {
  name: string;
  type: "file" | "directory" | "symlink";
  size: number;
  modified: string; // ISO 8601
}

// ── Platform Adapter ────────────────────────────────────────────────────────

export interface PlatformAdapter {
  // Screen
  captureScreen(displayId?: number, region?: ScreenRegion): Promise<ScreenshotResult>;

  // Mouse
  mouseClick(options: MouseClickOptions): Promise<void>;
  mouseMove(options: MouseMoveOptions): Promise<void>;
  mouseDrag(options: MouseDragOptions): Promise<void>;
  mouseScroll(options: MouseScrollOptions): Promise<void>;

  // Keyboard
  keyboardType(options: KeyboardTypeOptions): Promise<void>;
  keyboardKey(options: KeyboardKeyOptions): Promise<void>;

  // Applications
  listApplications(): Promise<AppInfo[]>;
  activateApplication(bundleIdOrName: string): Promise<void>;

  // Windows
  listWindows(): Promise<WindowInfo[]>;

  // Accessibility
  getAccessibilityTree(pid: number, maxDepth?: number): Promise<UIElement>;
  getMenuBar(pid: number): Promise<MenuBarItem[]>;
  clickMenuItem(pid: number, menuPath: string[]): Promise<void>;

  // Clipboard
  getClipboard(): Promise<ClipboardContents>;
  setClipboard(contents: ClipboardContents): Promise<void>;

  // File System
  readFile(path: string, encoding?: "utf-8" | "base64"): Promise<FileContents>;
  writeFile(path: string, content: string, encoding?: "utf-8" | "base64"): Promise<void>;
  listDirectory(path: string): Promise<DirectoryEntry[]>;
}
