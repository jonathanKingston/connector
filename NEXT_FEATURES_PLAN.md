# Connector — Next Features Plan

## Current State Summary

The connector is a well-architected MCP server providing 12 tools for full GUI
remote control of a macOS machine. All tools work correctly against a live Mac:

| Tool | Status | Notes |
|------|--------|-------|
| `screenshot` | Working | Returns 3840x2160 (Retina 2x) PNGs |
| `list_applications` | Working | Returns 9 foreground apps correctly |
| `list_windows` | Working | Returns all windows with bounds |
| `activate_application` | Working | Tested Safari, Maps |
| `get_accessibility_tree` | Working | Hierarchical JSON with roles/positions |
| `get_menu_bar` | Working | Full menu structure (~59KB for Safari) |
| `click_menu_item` | Working | Tested File→New Tab in Safari |
| `keyboard_type` | Working | Typed URLs into Safari address bar |
| `keyboard_key` | Working | Cmd+L, Cmd+W, Return, Escape all work |
| `mouse_click` | Working | Left click, right click (context menus) |
| `mouse_move` | Working | Cursor moves to coordinates |
| `mouse_drag` | Working | Tested on Maps |

Test suite: 37 tests across 7 files, all passing. Tests use in-memory
transport with a mock platform adapter — no OS or network dependency.

Architecture: Clean platform adapter pattern (`PlatformAdapter` interface →
`MacOSAdapter`). Tools layer is OS-agnostic. Auth is swappable (`AuthProvider`
interface → `PasswordAuthProvider`).

---

## Proposed Features (Priority Ordered)

### 1. Clipboard Read/Write

**Why:** Clipboard is the most natural way to extract text content from the
screen. Currently an agent can Cmd+C but has no way to read what was copied.
This is a critical gap — it makes "read the selected text" impossible.

**Tools to add:**
- `get_clipboard` — Read the current clipboard contents (text, and optionally
  detect if it contains an image and return that too)
- `set_clipboard` — Write text (or image data) to the clipboard

**Platform interface additions:**
```typescript
interface PlatformAdapter {
  getClipboard(): Promise<ClipboardContents>;
  setClipboard(contents: ClipboardContents): Promise<void>;
}

interface ClipboardContents {
  text: string | null;
  hasImage: boolean;
  imageData: string | null;  // base64 PNG if hasImage
}
```

**macOS implementation:** JXA `Application('System Events')` can't directly
access the clipboard, but `osascript -e 'the clipboard'` in AppleScript can.
Alternatively, use `pbpaste` for text and JXA with ObjC bridge to
`NSPasteboard` for richer clipboard access.

**Effort:** Small. ~2 hours.

---

### 2. Mouse Scroll

**Why:** Many apps require scrolling — web pages, long documents, lists. The
current mouse tools have click, move, and drag but no scroll. An agent currently
has no way to scroll down a webpage or list without using keyboard Page
Down/arrow keys, which don't always work in all contexts.

**Tool to add:**
- `mouse_scroll` — Scroll at given coordinates with specified delta (supports
  both vertical and horizontal scroll)

**Platform interface addition:**
```typescript
interface MouseScrollOptions {
  x: number;
  y: number;
  deltaX: number;  // horizontal scroll (positive = right)
  deltaY: number;  // vertical scroll (positive = down)
}

interface PlatformAdapter {
  mouseScroll(options: MouseScrollOptions): Promise<void>;
}
```

**macOS implementation:** Use CGEvent scroll wheel events via JXA/ObjC bridge:
```javascript
ObjC.import('CoreGraphics');
var event = $.CGEventCreateScrollWheelEvent($(), 0, 2, deltaY, deltaX);
$.CGEventPost($.kCGHIDEventTap, event);
```

**Effort:** Small. ~1 hour.

---

### 3. Screenshot Region Capture

**Why:** Full screenshots are 3840x2160 at Retina resolution — large payloads
that consume tokens for vision models. Often the agent only needs a small region
(e.g. a dialog box, a specific button area, or the result of an action in one
corner). Region capture reduces latency and token cost significantly.

**Enhancement to existing `screenshot` tool:**
Add optional `region` parameter:
```typescript
{
  displayId?: number;
  region?: { x: number; y: number; width: number; height: number };
}
```

**macOS implementation:** `screencapture` supports `-R x,y,w,h` for region
capture. Alternatively, capture full screen and crop in Node.js using the raw
PNG buffer (avoiding any image library dependency by using `sharp` or a simple
crop-by-re-encoding approach).

The `-R` flag in `screencapture` is the cleanest approach — no extra
dependencies needed.

**Effort:** Small. ~1 hour.

---

### 4. File System Operations

**Why:** Agents frequently need to read/write files on the remote machine —
downloading files, reading config, checking logs, transferring data. Currently
the only way is to open Terminal and type commands, which is fragile.

**Tools to add:**
- `read_file` — Read a file and return its contents (text or base64 for binary)
- `write_file` — Write content to a file
- `list_directory` — List files/directories at a path

**Platform interface additions:**
```typescript
interface PlatformAdapter {
  readFile(path: string, encoding?: 'utf-8' | 'base64'): Promise<FileContents>;
  writeFile(path: string, content: string, encoding?: 'utf-8' | 'base64'): Promise<void>;
  listDirectory(path: string): Promise<DirectoryEntry[]>;
}

interface FileContents {
  content: string;
  encoding: string;
  size: number;
}

interface DirectoryEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: string;  // ISO 8601
}
```

**Implementation:** Use Node.js `fs` module directly — no osascript needed.
This works on all platforms.

**Security consideration:** Should support configurable path allowlists/
denylists to prevent access to sensitive files (e.g. ~/.ssh, /etc/shadow).

**Effort:** Medium. ~3-4 hours (including path security).

---

### 5. Shell Command Execution

**Why:** Some tasks are far more efficient via CLI than GUI (installing
packages, running scripts, checking system state, `grep`, `curl`, etc.).
Currently the agent must open Terminal, type commands, and screenshot to read
output — extremely slow and unreliable for multi-step CLI workflows.

**Tools to add:**
- `run_command` — Execute a shell command and return stdout/stderr/exit code

**Platform interface addition:**
```typescript
interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
}

interface PlatformAdapter {
  runCommand(command: string, args?: string[], options?: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string>;
  }): Promise<CommandResult>;
}
```

**Implementation:** Wraps `child_process.execFile` (already have the `exec`
helper). Needs careful security boundaries:
- Configurable command allowlist (e.g. only allow `ls`, `cat`, `grep`, etc.)
- Maximum execution timeout (default 30s)
- Maximum output size (prevent OOM from `cat /dev/urandom`)
- No shell interpretation by default (use `execFile`, not `exec` with shell)

**Effort:** Medium. ~3-4 hours (including security hardening).

---

### 6. Window Management Tools

**Why:** Agents often need to arrange windows — move a window aside to see
what's behind it, resize a window, minimize/unminimize, or go fullscreen. The
current `list_windows` returns window state but provides no way to change it.
During testing, I observed overlapping windows (Safari over Maps) — the guide
mentions this as a problem but offers no tool-level solution.

**Tools to add:**
- `move_window` — Move a window to new coordinates
- `resize_window` — Resize a window
- `minimize_window` / `unminimize_window`
- `set_fullscreen` — Toggle fullscreen on a window

**Platform interface additions:**
```typescript
interface PlatformAdapter {
  moveWindow(pid: number, windowIndex: number, x: number, y: number): Promise<void>;
  resizeWindow(pid: number, windowIndex: number, width: number, height: number): Promise<void>;
  minimizeWindow(pid: number, windowIndex: number): Promise<void>;
  unminimizeWindow(pid: number, windowIndex: number): Promise<void>;
  setFullscreen(pid: number, windowIndex: number, fullscreen: boolean): Promise<void>;
}
```

**macOS implementation:** JXA System Events can set window position and size:
```javascript
var proc = se.processes.whose({unixId: pid})[0];
var win = proc.windows[windowIndex];
win.position = [x, y];
win.size = [width, height];
```

**Effort:** Medium. ~3 hours.

---

### 7. Notification/Alert Detection

**Why:** macOS dialogs and notifications can block or redirect agent workflows.
A "Save changes?" dialog or a system notification can appear unexpectedly. The
agent currently has to screenshot and visually parse to detect these — a
dedicated tool would be far more reliable and faster.

**Tools to add:**
- `get_alerts` — Return any currently-visible alert/dialog windows across all
  apps. Returns button labels so the agent can dismiss them programmatically.
- `get_notifications` — Return recent macOS notification center items.

**Platform interface additions:**
```typescript
interface AlertInfo {
  appName: string;
  appPid: number;
  title: string;
  message: string;
  buttons: string[];  // e.g. ["Save", "Don't Save", "Cancel"]
}

interface PlatformAdapter {
  getAlerts(): Promise<AlertInfo[]>;
  getNotifications(): Promise<NotificationInfo[]>;
}
```

**macOS implementation:** Use accessibility tree inspection, specifically
looking for `AXSheet`, `AXDialog`, and `AXAlert` roles. For notifications,
query `NSUserNotificationCenter` or parse the notification center UI.

**Effort:** Medium. ~4 hours.

---

### 8. Wait/Poll Utilities

**Why:** GUI interactions are asynchronous — clicking a button may trigger a
page load, opening a file dialog may take a moment, etc. Currently the agent
must screenshot repeatedly to check if an action completed. A "wait for
condition" primitive would reduce round-trips dramatically.

**Tools to add:**
- `wait_for_element` — Poll the accessibility tree until an element matching
  given criteria appears (or timeout). Criteria: role, title substring, value
  substring.
- `wait_for_window` — Wait until a window with a matching title appears.
- `wait_for_image_stable` — Wait until consecutive screenshots are identical
  (screen has settled after an animation/load).

**Platform interface additions:**
```typescript
interface WaitForElementOptions {
  pid: number;
  role?: string;
  titleContains?: string;
  valueContains?: string;
  timeout?: number;    // ms, default 10000
  interval?: number;   // ms, default 500
}

interface PlatformAdapter {
  waitForElement(options: WaitForElementOptions): Promise<UIElement | null>;
  waitForWindow(titleContains: string, timeout?: number): Promise<WindowInfo | null>;
  waitForScreenStable(timeout?: number, threshold?: number): Promise<boolean>;
}
```

**Effort:** Medium-large. ~5 hours.

---

### 9. Multi-Display Support

**Why:** The `screenshot` tool already accepts a `displayId` parameter, but
there's no tool to list available displays with their IDs, resolutions, and
positions. An agent on a multi-monitor setup can't discover which display to
target.

**Tool to add:**
- `list_displays` — Return all connected displays with ID, resolution, scaling
  factor, position, and whether it's the main display.

**Platform interface addition:**
```typescript
interface DisplayInfo {
  id: number;
  width: number;        // points
  height: number;       // points
  pixelWidth: number;   // actual pixels (retina)
  pixelHeight: number;
  scaleFactor: number;  // e.g. 2 for Retina
  position: { x: number; y: number };
  isMain: boolean;
}

interface PlatformAdapter {
  listDisplays(): Promise<DisplayInfo[]>;
}
```

**macOS implementation:** Use CoreGraphics via JXA ObjC bridge:
`CGGetActiveDisplayList`, `CGDisplayBounds`, `CGDisplayPixelsWide`, etc.

**Effort:** Small-medium. ~2 hours.

---

### 10. Structured Text Extraction (OCR)

**Why:** While `get_accessibility_tree` can extract text from native UI
elements, it cannot read text rendered in images, canvases, PDFs, or web content
that doesn't expose accessibility text. An OCR tool would let the agent read
any visible text without relying on the accessibility layer.

**Tool to add:**
- `extract_text` — Run OCR on a screen region and return recognized text with
  bounding boxes.

**macOS implementation:** macOS has built-in OCR via the Vision framework
(`VNRecognizeTextRequest`). Accessible via JXA ObjC bridge or by writing a
small Swift helper.

**Effort:** Large. ~6-8 hours (Swift helper + integration).

---

### 11. Drag-and-Drop with Intermediate Points

**Why:** The current `mouse_drag` goes in a straight line from start to end.
Some drag interactions require following a specific path (e.g. drawing, complex
drag-and-drop where you need to hover over a drop zone to expand it before
releasing).

**Enhancement to existing `mouse_drag` tool:**
Add optional `waypoints` parameter:
```typescript
interface MouseDragOptions {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  button: MouseButton;
  waypoints?: Array<{ x: number; y: number }>;  // intermediate points
  speed?: 'instant' | 'slow' | 'normal';        // drag speed
}
```

**Effort:** Small. ~2 hours.

---

### 12. Session Health & System Info

**Why:** Agents need to know the state of the machine they're controlling —
is the screen locked? What's the screen resolution? What OS version? Is the
machine responsive? This contextual data helps agents make better decisions.

**Tools to add:**
- `get_system_info` — Returns OS version, hostname, screen resolution(s),
  current user, uptime, whether screen is locked, battery state (if laptop).
- `ping` / `health_check` — Lightweight tool that confirms the server is
  responsive and returns latency.

**Effort:** Small. ~2 hours.

---

## Implementation Priority & Roadmap

### Phase 1 — High-Impact, Low-Effort (Week 1)
1. **Clipboard read/write** — Unlocks text extraction workflows
2. **Mouse scroll** — Completes the mouse interaction story
3. **Screenshot region capture** — Reduces latency and token cost

### Phase 2 — Power Features (Week 2)
4. **File system operations** — Enables file-based workflows
5. **Shell command execution** — Enables CLI workflows
6. **Window management** — Solves the overlapping window problem

### Phase 3 — Intelligence Layer (Week 3)
7. **Notification/alert detection** — Robustness against unexpected dialogs
8. **Wait/poll utilities** — Reduces round-trips for async GUI operations
9. **Multi-display support** — Completes multi-monitor story

### Phase 4 — Advanced (Week 4+)
10. **OCR/text extraction** — Vision framework integration
11. **Drag waypoints** — Complex drag interactions
12. **System info** — Operational awareness

---

## Test Strategy for New Features

The existing test pattern is solid — mock platform + in-memory MCP transport.
For each new tool:

1. **Tool-level tests** (in `test/tools/`): Verify the MCP tool calls the
   correct platform method with the correct arguments, and returns the expected
   MCP response format. Use the existing `createMockPlatform()` +
   `createTestContext()` helpers.

2. **Platform adapter tests** (if complex logic): For implementations that
   have non-trivial logic beyond a single OS command (e.g. wait/poll, clipboard
   format detection, OCR post-processing), add unit tests for the platform
   module itself.

3. **Error case tests**: Each tool should test error propagation (platform
   throws → tool returns MCP error).

---

## Architecture Notes

- All new features should follow the existing pattern: add to `PlatformAdapter`
  interface, implement in `MacOSAdapter`, create tool registration function,
  and wire up in `registerTools`.
- Keep the platform adapter stateless — no mutable state between calls.
- Security-sensitive features (file system, shell commands) should have
  configurable restrictions in `Config` (allowlists, path restrictions).
- The MCP SDK's tool registration handles parameter validation via Zod schemas
  automatically — lean on this for input validation.
