# Connector

An MCP (Model Context Protocol) server for remote machine control. Allows an AI agent to see the screen, click, type, inspect UI elements, navigate menus, and manage applications — everything an administrator could do over remote desktop.

## Features

| Category | Tools | Description |
|----------|-------|-------------|
| **Screen** | `screenshot` | Capture the screen as a PNG image |
| **Mouse** | `mouse_click`, `mouse_move`, `mouse_drag` | Click, move, and drag at screen coordinates |
| **Keyboard** | `keyboard_type`, `keyboard_key` | Type text and press keys with modifiers |
| **Accessibility** | `get_accessibility_tree`, `get_menu_bar`, `click_menu_item` | Inspect UI hierarchy, menus, and click menu items |
| **Applications** | `list_applications`, `list_windows`, `activate_application` | List running apps/windows and bring apps to foreground |
| **Terminal** | `terminal_exec` | Execute shell commands via bash (macOS and Linux) |

## Architecture

```
┌─────────────┐    HTTP + Auth     ┌──────────────────────────────┐
│  MCP Client  │ ───────────────► │  Connector MCP Server         │
│  (AI Agent)  │ ◄─────────────── │  (runs on target machine)     │
└─────────────┘   Streamable HTTP  │                              │
                                   │  ┌─────────┐  ┌───────────┐ │
                                   │  │  Tools   │→ │ Platform  │ │
                                   │  │  Layer   │  │ Adapter   │ │
                                   │  └─────────┘  │ (macOS)   │ │
                                   │               └───────────┘ │
                                   └──────────────────────────────┘
```

The server runs on the target machine and uses a **platform adapter pattern**:
- **macOS:** screenshot/mouse/keyboard/accessibility/application tools and `terminal_exec`
- **Linux (terminal-only mode):** `terminal_exec` only (no GUI tools)

## Prerequisites

- **Node.js** 20 or later
- One of:
  - **macOS** with Accessibility permissions (for GUI tools); `terminal_exec` uses `/bin/bash`
  - **Linux terminal-only host** (for `terminal_exec` when not on macOS)
- For macOS GUI tools: grant Terminal (or whichever app runs the server) access in System Settings → Privacy & Security → Accessibility

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Run (password is required)
CONNECTOR_PASSWORD=your-secret-password npm start
```

The server starts on `http://0.0.0.0:3100/mcp` by default.

## Configuration

All configuration is via environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONNECTOR_PASSWORD` | **Yes** | — | Password for Bearer token authentication |
| `CONNECTOR_PORT` | No | `3100` | Port to listen on |
| `CONNECTOR_HOST` | No | `0.0.0.0` | Host/IP to bind to |
| `CONNECTOR_TOOL_MODULES` | No | — | Comma-separated module specifiers to load extra setup-specific tools |
| `CONNECTOR_DEBUG` | No | off | Set to `1` or `true` to log MCP HTTP requests, response bodies (SSE events parsed as JSON-RPC where possible, size-capped), and `terminal_exec` to stderr (`[connector]` prefix) |

### Setup-specific tool modules

Connector can load extra tools at startup without modifying core host code.

1. Create a module that exports either:
   - `registerTools(server, platform)` (named export), or
   - a default export function with the same signature.
2. Set `CONNECTOR_TOOL_MODULES` to one or more module specifiers (comma-separated).

Example:

```bash
CONNECTOR_PASSWORD=your-secret-password \
CONNECTOR_TOOL_MODULES=./examples/custom-tools/setup-tools.mjs \
npm start
```

Prototype module: [`examples/custom-tools/setup-tools.mjs`](./examples/custom-tools/setup-tools.mjs)

## Authentication

All requests must include an `Authorization: Bearer <password>` header. The password is compared using constant-time comparison to prevent timing attacks.

Example with curl:
```bash
curl -X POST http://localhost:3100/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-password" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}'
```

## Development

```bash
# Type check
npm run lint

# Run tests
npm test

# Watch tests
npm run test:watch

# Build
npm run build
```

## Project Structure

```
src/
├── index.ts                    # Entry point: Express + Streamable HTTP + auth
├── server.ts                   # McpServer creation and tool registration
├── config.ts                   # Configuration from environment variables
├── auth/
│   ├── types.ts                # AuthProvider interface
│   └── password.ts             # Password-based auth (Bearer token)
├── tools/
│   ├── index.ts                # Register all tools
│   ├── screenshot.ts           # screenshot tool
│   ├── mouse.ts                # mouse_click, mouse_move, mouse_drag
│   ├── keyboard.ts             # keyboard_type, keyboard_key
│   ├── accessibility.ts        # get_accessibility_tree, get_menu_bar, click_menu_item
│   ├── applications.ts         # list_applications, list_windows, activate_application
│   ├── terminal.ts             # terminal_exec
│   └── extensions.ts           # external setup-specific tool module loader
├── platform/
│   ├── types.ts                # PlatformAdapter interface + all data types
│   ├── factory.ts              # OS detection → adapter creation
│   ├── bash-terminal.ts        # Shared /bin/bash execution (macOS + Linux)
│   ├── linux/
│   │   ├── index.ts            # Linux terminal-only adapter
│   │   └── terminal.ts         # Re-export bash execution
│   └── macos/
│       ├── index.ts            # MacOSAdapter class
│       ├── screenshot.ts       # screencapture CLI wrapper
│       ├── mouse.ts            # CGEvent via JXA/ObjC bridge
│       ├── keyboard.ts         # System Events keystroke/keyCode
│       ├── accessibility.ts    # UI element tree, menu bar, menu clicks
│       └── applications.ts     # App/window listing and activation
└── helpers/
    └── exec.ts                 # Promise-wrapped execFile with timeout

examples/
└── custom-tools/
    └── setup-tools.mjs         # prototype external tool module
```

## Tool Details

### screenshot

Captures the screen and returns a base64-encoded PNG image.

**Parameters:**
- `displayId` (optional, number) — Display ID for multi-monitor setups

### mouse_click

Click the mouse at screen coordinates.

**Parameters:**
- `x` (number) — X coordinate
- `y` (number) — Y coordinate
- `button` (optional, "left" | "right" | "middle") — Default: "left"
- `clickCount` (optional, 1 | 2 | 3) — Default: 1

### mouse_move

Move the mouse cursor without clicking.

**Parameters:**
- `x` (number) — X coordinate
- `y` (number) — Y coordinate

### mouse_drag

Drag from one point to another.

**Parameters:**
- `startX`, `startY` (number) — Start coordinates
- `endX`, `endY` (number) — End coordinates
- `button` (optional) — Default: "left"

### keyboard_type

Type a text string.

**Parameters:**
- `text` (string) — Text to type

### keyboard_key

Press a key with optional modifiers.

**Parameters:**
- `key` (string) — Key name (e.g. "return", "tab", "escape", "a", "f5")
- `modifiers` (optional, array) — e.g. ["command", "shift"]

### get_accessibility_tree

Get the UI element hierarchy for a running application.

**Parameters:**
- `pid` (number) — Process ID (use `list_applications` to find it)
- `maxDepth` (optional, number) — Default: 3

### get_menu_bar

Get the menu bar structure for an application.

**Parameters:**
- `pid` (number) — Process ID

### click_menu_item

Click a menu item by navigating through the menu hierarchy.

**Parameters:**
- `pid` (number) — Process ID
- `menuPath` (string[]) — e.g. ["File", "Save As…"]

### list_applications

List all running foreground applications. No parameters.

### list_windows

List all open windows across all applications. No parameters.

### activate_application

Bring an application to the foreground.

**Parameters:**
- `target` (string) — App name (e.g. "Safari") or bundle ID (e.g. "com.apple.Safari")

### terminal_exec

Execute a shell command on the host via `/bin/bash` with `set -euo pipefail` (macOS and Linux adapters).

**Parameters:**
- `command` (string) — Shell command to run
- `timeoutMs` (optional, number) — Command timeout in milliseconds (default 60000, max 600000)

## Security Notes

- The server requires a password on every request (Bearer token auth)
- The auth layer is designed to be swappable — future versions may use token-based auth via a proxy service
- Consider binding to `127.0.0.1` and using an SSH tunnel for remote access
- Grant accessibility permissions only to trusted applications

## License

ISC
