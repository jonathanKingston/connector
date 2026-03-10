/**
 * macOS platform adapter — delegates to individual module implementations.
 */

import type {
  PlatformAdapter,
  ScreenRegion,
  ScreenshotResult,
  MouseClickOptions,
  MouseMoveOptions,
  MouseDragOptions,
  MouseScrollOptions,
  KeyboardTypeOptions,
  KeyboardKeyOptions,
  AppInfo,
  WindowInfo,
  UIElement,
  MenuBarItem,
  ClipboardContents,
  FileContents,
  DirectoryEntry,
} from "../types.js";

import { captureScreen } from "./screenshot.js";
import { mouseClick, mouseMove, mouseDrag, mouseScroll } from "./mouse.js";
import { keyboardType, keyboardKey } from "./keyboard.js";
import { getAccessibilityTree, getMenuBar, clickMenuItem } from "./accessibility.js";
import { listApplications, activateApplication, listWindows } from "./applications.js";
import { getClipboard, setClipboard } from "./clipboard.js";
import { readFile, writeFile, listDirectory } from "./filesystem.js";

export class MacOSAdapter implements PlatformAdapter {
  async captureScreen(displayId?: number, region?: ScreenRegion): Promise<ScreenshotResult> {
    return captureScreen(displayId, region);
  }

  async mouseClick(options: MouseClickOptions): Promise<void> {
    return mouseClick(options);
  }

  async mouseMove(options: MouseMoveOptions): Promise<void> {
    return mouseMove(options);
  }

  async mouseDrag(options: MouseDragOptions): Promise<void> {
    return mouseDrag(options);
  }

  async mouseScroll(options: MouseScrollOptions): Promise<void> {
    return mouseScroll(options);
  }

  async keyboardType(options: KeyboardTypeOptions): Promise<void> {
    return keyboardType(options);
  }

  async keyboardKey(options: KeyboardKeyOptions): Promise<void> {
    return keyboardKey(options);
  }

  async listApplications(): Promise<AppInfo[]> {
    return listApplications();
  }

  async activateApplication(bundleIdOrName: string): Promise<void> {
    return activateApplication(bundleIdOrName);
  }

  async listWindows(): Promise<WindowInfo[]> {
    return listWindows();
  }

  async getAccessibilityTree(pid: number, maxDepth?: number): Promise<UIElement> {
    return getAccessibilityTree(pid, maxDepth);
  }

  async getMenuBar(pid: number): Promise<MenuBarItem[]> {
    return getMenuBar(pid);
  }

  async clickMenuItem(pid: number, menuPath: string[]): Promise<void> {
    return clickMenuItem(pid, menuPath);
  }

  async getClipboard(): Promise<ClipboardContents> {
    return getClipboard();
  }

  async setClipboard(contents: ClipboardContents): Promise<void> {
    return setClipboard(contents);
  }

  async readFile(path: string, encoding?: "utf-8" | "base64"): Promise<FileContents> {
    return readFile(path, encoding);
  }

  async writeFile(path: string, content: string, encoding?: "utf-8" | "base64"): Promise<void> {
    return writeFile(path, content, encoding);
  }

  async listDirectory(path: string): Promise<DirectoryEntry[]> {
    return listDirectory(path);
  }
}
