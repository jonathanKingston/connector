# Mac Connector Guide

## Overview

The "Testing mac" connector provides full GUI remote control of a macOS machine. It enables an agent to see the screen, interact with applications via keyboard and mouse, inspect UI elements, and navigate menus programmatically.

## Available Tools

| Tool | Purpose |
|------|---------|
| `screenshot` | Capture the current screen as a PNG image |
| `list_applications` | List all running foreground apps with name, bundle ID, PID, and active state |
| `list_windows` | List all open windows with title, position, size, and minimized/fullscreen state |
| `activate_application` | Bring an app to the foreground by name or bundle ID |
| `get_accessibility_tree` | Inspect the UI element hierarchy of an app (by PID) |
| `get_menu_bar` | Read the full menu bar structure for an app (by PID) |
| `click_menu_item` | Click a menu item by navigating a menu path (e.g. `["File", "Save"]`) |
| `keyboard_type` | Type a string of text |
| `keyboard_key` | Press a key with optional modifiers (e.g. Cmd+L) |
| `mouse_click` | Click at screen coordinates (left/right/middle, single/double/triple) |
| `mouse_move` | Move cursor to coordinates without clicking |
| `mouse_drag` | Drag from one point to another |

## Tips for Agents

### General Workflow

1. **Start with `screenshot` + `list_applications` + `list_windows` in parallel.** This gives you full situational awareness in a single round trip — what's on screen, what apps are running, and what windows exist.
2. **Use PIDs from `list_applications` for all PID-dependent tools.** You need the PID for `get_accessibility_tree`, `get_menu_bar`, and `click_menu_item`.
3. **Take a screenshot after every significant action** to verify it worked. GUI interactions can fail silently (e.g. clicking the wrong coordinates).

### Keyboard Shortcuts Over Mouse Clicks

Prefer keyboard shortcuts over mouse clicks when possible — they are more reliable and don't depend on pixel coordinates:

- **Cmd+L** — Focus the address bar in Safari/browsers
- **Cmd+T** — New tab
- **Cmd+W** — Close window/tab
- **Cmd+Q** — Quit application
- **Cmd+Space** — Open Spotlight search (useful for launching apps)
- **Cmd+A** — Select all
- **Cmd+C / Cmd+V** — Copy / Paste
- **Tab / Shift+Tab** — Navigate between form fields
- **Return** — Confirm / submit

### Mouse Coordinates

- **Retina displays return screenshots at 2× resolution** (e.g. 3840×2160 pixels for a 1920×1080 screen point space). All mouse tools use **screen points**, not screenshot pixels. If you estimate a position from a screenshot, **divide the pixel coordinates by 2** to get the correct screen point. Prefer using `list_windows` bounds or `get_accessibility_tree` positions instead — these already use screen points.
- **Beware of overlapping windows.** Even after calling `activate_application`, if you click coordinates where another window visually overlaps the target app, the click may land on the wrong window. Either move/resize windows first, or use keyboard shortcuts to avoid coordinate issues entirely.

### Application Interaction

- **`activate_application`** must be called before interacting with an app that isn't in the foreground. Keyboard and mouse input goes to the frontmost app.
- You can target apps by **name** (e.g. "Safari") or **bundle ID** (e.g. "com.apple.Safari").
- **`click_menu_item`** is the most reliable way to trigger app actions — more reliable than keyboard shortcuts or mouse clicks on toolbar buttons. Use `get_menu_bar` first to discover available items. Note that `get_menu_bar` can return very large responses (50KB+ for complex apps like Safari) — only call it when you need to discover menu structure.

### Accessibility Tree

- `get_accessibility_tree` accepts a `maxDepth` parameter (default 3). Use lower depths for a quick overview, higher depths (4-5) when you need to find specific nested elements.
- The tree returns roles, titles, values, positions, and sizes — use positions for precise mouse clicks on UI elements.

### Common Patterns

**Opening a URL in Safari:**
1. `activate_application("Safari")`
2. `keyboard_key("l", modifiers: ["command"])` — focus address bar
3. `keyboard_type("example.com")`
4. `keyboard_key("return")`

**Launching an app not currently running:**
1. `keyboard_key("space", modifiers: ["command"])` — open Spotlight
2. `keyboard_type("AppName")`
3. `keyboard_key("return")`

**Navigating menus:**
1. Get the PID from `list_applications`
2. `get_menu_bar(pid)` to discover menu structure
3. `click_menu_item(pid, ["Menu", "Submenu", "Item"])`

**Selecting text with double/triple click:**
- `mouse_click(x, y, clickCount: 2)` — double-click to select a word
- `mouse_click(x, y, clickCount: 3)` — triple-click to select a paragraph/line

**Right-clicking for context menus:**
1. `mouse_click(x, y, button: "right")` — open context menu
2. Use `screenshot` to read the menu options
3. `mouse_click(x, y)` on the desired option, or `keyboard_key("escape")` to dismiss

### Performance

- **Parallelise independent calls.** `screenshot`, `list_applications`, and `list_windows` have no dependencies on each other — always call them together.
- **Avoid unnecessary screenshots.** Only screenshot when you need visual confirmation. For structured data, prefer `list_windows` or `get_accessibility_tree`.
- **Use `click_menu_item` instead of navigating menus with mouse clicks.** A single call replaces multiple mouse moves and clicks through menu hierarchies.
