/**
 * Mock platform adapter for testing tools.
 * All methods are vi.fn() so tests can assert calls and control return values.
 */

import { vi } from "vitest";
import type { PlatformAdapter } from "../../src/platform/types.js";

export function createMockPlatform(): PlatformAdapter & {
  [K in keyof PlatformAdapter]: ReturnType<typeof vi.fn>;
} {
  return {
    captureScreen: vi.fn().mockResolvedValue({
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      mimeType: "image/png",
      width: 1920,
      height: 1080,
    }),
    mouseClick: vi.fn().mockResolvedValue(undefined),
    mouseMove: vi.fn().mockResolvedValue(undefined),
    mouseDrag: vi.fn().mockResolvedValue(undefined),
    mouseScroll: vi.fn().mockResolvedValue(undefined),
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
    getClipboard: vi.fn().mockResolvedValue({ text: "mock clipboard text", hasImage: false, imageData: null }),
    setClipboard: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue({ content: "file content", encoding: "utf-8", size: 12 }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listDirectory: vi.fn().mockResolvedValue([
      { name: "test.txt", type: "file", size: 100, modified: "2025-01-01T00:00:00.000Z" },
      { name: "subdir", type: "directory", size: 0, modified: "2025-01-01T00:00:00.000Z" },
    ]),
    runCommand: vi.fn().mockResolvedValue({ stdout: "hello\n", stderr: "", exitCode: 0, timedOut: false }),
    moveWindow: vi.fn().mockResolvedValue(undefined),
    resizeWindow: vi.fn().mockResolvedValue(undefined),
    minimizeWindow: vi.fn().mockResolvedValue(undefined),
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    getAlerts: vi.fn().mockResolvedValue([
      { appName: "Safari", appPid: 1234, title: "Save Changes?", message: "Do you want to save?", buttons: ["Save", "Don't Save", "Cancel"] },
    ]),
    getNotifications: vi.fn().mockResolvedValue([
      { appName: "Mail", title: "New Message", message: "You have a new email", timestamp: "2025-01-01T00:00:00.000Z" },
    ]),
    waitForElement: vi.fn().mockResolvedValue({
      role: "AXButton",
      title: "OK",
      value: null,
      description: null,
      enabled: true,
      position: { x: 100, y: 200 },
      size: { width: 80, height: 30 },
      children: [],
    }),
    waitForWindow: vi.fn().mockResolvedValue({
      id: 1,
      title: "New Document",
      appName: "TextEdit",
      appPid: 9999,
      bounds: { x: 0, y: 0, width: 800, height: 600 },
      isMinimized: false,
      isFullscreen: false,
    }),
    listDisplays: vi.fn().mockResolvedValue([
      { id: 1, width: 1920, height: 1080, pixelWidth: 3840, pixelHeight: 2160, scaleFactor: 2, position: { x: 0, y: 0 }, isMain: true },
    ]),
    extractText: vi.fn().mockResolvedValue([
      { text: "Hello World", confidence: 0.98, bounds: { x: 100, y: 200, width: 200, height: 30 } },
    ]),
    getSystemInfo: vi.fn().mockResolvedValue({
      os: "macOS",
      osVersion: "15.0",
      hostname: "test-mac",
      username: "testuser",
      uptime: 86400,
      screenResolution: { width: 3840, height: 2160 },
      isScreenLocked: false,
      batteryState: { level: 85, isCharging: false, isPluggedIn: true },
    }),
    healthCheck: vi.fn().mockResolvedValue({
      status: "ok",
      timestamp: "2025-01-01T00:00:00.000Z",
      latencyMs: 42,
    }),
  };
}
