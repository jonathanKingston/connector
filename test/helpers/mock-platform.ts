/**
 * Mock platform adapter for testing tools.
 * All methods are vi.fn() so tests can assert calls and control return values.
 */

import { vi } from "vitest";
import type { PlatformAdapter } from "../../src/platform/types.js";

export type MockPlatform = PlatformAdapter & {
  captureScreen: ReturnType<typeof vi.fn>;
  mouseClick: ReturnType<typeof vi.fn>;
  mouseMove: ReturnType<typeof vi.fn>;
  mouseDrag: ReturnType<typeof vi.fn>;
  keyboardType: ReturnType<typeof vi.fn>;
  keyboardKey: ReturnType<typeof vi.fn>;
  listApplications: ReturnType<typeof vi.fn>;
  activateApplication: ReturnType<typeof vi.fn>;
  listWindows: ReturnType<typeof vi.fn>;
  getAccessibilityTree: ReturnType<typeof vi.fn>;
  getMenuBar: ReturnType<typeof vi.fn>;
  clickMenuItem: ReturnType<typeof vi.fn>;
  terminalExec: ReturnType<typeof vi.fn>;
};

export function createMockPlatform(): MockPlatform {
  return {
    capabilities: {
      screenshot: true,
      mouse: true,
      keyboard: true,
      accessibility: true,
      applications: true,
      terminal: true,
    },
    captureScreen: vi.fn().mockResolvedValue({
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      width: 1920,
      height: 1080,
    }),
    mouseClick: vi.fn().mockResolvedValue(undefined),
    mouseMove: vi.fn().mockResolvedValue(undefined),
    mouseDrag: vi.fn().mockResolvedValue(undefined),
    keyboardType: vi.fn().mockResolvedValue(undefined),
    keyboardKey: vi.fn().mockResolvedValue(undefined),
    listApplications: vi.fn().mockResolvedValue([
      { name: "Safari", bundleId: "com.apple.Safari", pid: 1234, isActive: true },
      { name: "Finder", bundleId: "com.apple.finder", pid: 5678, isActive: false },
    ]),
    activateApplication: vi.fn().mockResolvedValue(undefined),
    listWindows: vi.fn().mockResolvedValue([
      {
        id: 0,
        title: "Apple - Start",
        appName: "Safari",
        appPid: 1234,
        bounds: { x: 0, y: 0, width: 1440, height: 900 },
        isMinimized: false,
        isFullscreen: false,
      },
    ]),
    getAccessibilityTree: vi.fn().mockResolvedValue({
      role: "AXApplication",
      title: "Safari",
      value: null,
      description: null,
      enabled: true,
      position: { x: 0, y: 0 },
      size: { width: 1440, height: 900 },
      children: [
        {
          role: "AXWindow",
          title: "Apple - Start",
          value: null,
          description: null,
          enabled: true,
          position: { x: 0, y: 0 },
          size: { width: 1440, height: 900 },
          children: [],
        },
      ],
    }),
    getMenuBar: vi.fn().mockResolvedValue([
      {
        title: "File",
        children: [
          { title: "New Window", enabled: true, shortcut: "Cmd+N", children: [] },
          { title: "Close Window", enabled: true, shortcut: "Cmd+W", children: [] },
        ],
      },
    ]),
    clickMenuItem: vi.fn().mockResolvedValue(undefined),
    terminalExec: vi.fn().mockResolvedValue({
      stdout: "ok\n",
      stderr: "",
    }),
  };
}
