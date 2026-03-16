/**
 * Linux terminal-only platform adapter.
 *
 * Exposes terminal_exec and intentionally disables GUI-only operations.
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
import { terminalExec } from "./terminal.js";

const LINUX_TERMINAL_CAPABILITIES: PlatformCapabilities = {
  screenshot: false,
  mouse: false,
  keyboard: false,
  accessibility: false,
  applications: false,
  terminal: true,
};

const TERMINAL_ONLY_ERROR =
  "This operation requires a graphical desktop session and is not available on terminal-only Linux.";

function unsupportedGuiOperation(): never {
  throw new Error(TERMINAL_ONLY_ERROR);
}

export class LinuxTerminalAdapter implements PlatformAdapter {
  readonly capabilities = LINUX_TERMINAL_CAPABILITIES;

  async captureScreen(_displayId?: number): Promise<ScreenshotResult> {
    unsupportedGuiOperation();
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
