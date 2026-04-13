/**
 * Windows platform adapter — screenshot (GDI+) and terminal (PowerShell).
 *
 * Mouse, keyboard, accessibility, and application tools are not implemented.
 */

import type {
  PlatformAdapter,
  PlatformCapabilities,
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
  TerminalExecOptions,
  TerminalExecResult,
} from "../types.js";
import { captureScreen } from "./screenshot.js";
import { terminalExec } from "./terminal.js";

const WINDOWS_CAPABILITIES: PlatformCapabilities = {
  screenshot: true,
  mouse: false,
  keyboard: false,
  accessibility: false,
  applications: false,
  terminal: true,
};

const UNSUPPORTED_GUI_ERROR =
  "This operation is not implemented on Windows (screenshot and terminal_exec are supported).";

function unsupportedGuiOperation(): never {
  throw new Error(UNSUPPORTED_GUI_ERROR);
}

export class WindowsAdapter implements PlatformAdapter {
  readonly capabilities = WINDOWS_CAPABILITIES;

  async captureScreen(displayId?: number): Promise<ScreenshotResult> {
    return captureScreen(displayId);
  }

  async mouseClick(_options: MouseClickOptions): Promise<void> {
    unsupportedGuiOperation();
  }

  async mouseMove(_options: MouseMoveOptions): Promise<void> {
    unsupportedGuiOperation();
  }

  async mouseDrag(_options: MouseDragOptions): Promise<void> {
    unsupportedGuiOperation();
  }

  async keyboardType(_options: KeyboardTypeOptions): Promise<void> {
    unsupportedGuiOperation();
  }

  async keyboardKey(_options: KeyboardKeyOptions): Promise<void> {
    unsupportedGuiOperation();
  }

  async listApplications(): Promise<AppInfo[]> {
    unsupportedGuiOperation();
  }

  async activateApplication(_bundleIdOrName: string): Promise<void> {
    unsupportedGuiOperation();
  }

  async listWindows(): Promise<WindowInfo[]> {
    unsupportedGuiOperation();
  }

  async getAccessibilityTree(_pid: number, _maxDepth?: number): Promise<UIElement> {
    unsupportedGuiOperation();
  }

  async getMenuBar(_pid: number): Promise<MenuBarItem[]> {
    unsupportedGuiOperation();
  }

  async clickMenuItem(_pid: number, _menuPath: string[]): Promise<void> {
    unsupportedGuiOperation();
  }

  async terminalExec(options: TerminalExecOptions): Promise<TerminalExecResult> {
    return terminalExec(options);
  }
}
