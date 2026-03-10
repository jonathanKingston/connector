/**
 * macOS platform adapter — delegates to individual module implementations.
 */

import type {
  PlatformAdapter,
  ScreenshotResult,
  MouseClickOptions,
  MouseMoveOptions,
  MouseDragOptions,
  KeyboardTypeOptions,
  KeyboardKeyOptions,
  AppInfo,
  WindowInfo,
  UIElement,
  MenuBarItem,
} from "../types.js";

import { captureScreen } from "./screenshot.js";
import { mouseClick, mouseMove, mouseDrag } from "./mouse.js";
import { keyboardType, keyboardKey } from "./keyboard.js";
import { getAccessibilityTree, getMenuBar, clickMenuItem } from "./accessibility.js";
import { listApplications, activateApplication, listWindows } from "./applications.js";

export class MacOSAdapter implements PlatformAdapter {
  async captureScreen(displayId?: number): Promise<ScreenshotResult> {
    return captureScreen(displayId);
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
}
