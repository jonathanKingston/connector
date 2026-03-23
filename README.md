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
| **Terminal** | `terminal_exec` | Execute shell commands on terminal-only Linux hosts |

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
- **macOS (GUI mode):** screenshot/mouse/keyboard/accessibility/application tools
- **Linux (terminal-only mode):** `terminal_exec`

## Prerequisites

- **Node.js** 20 or later
- One of:
  - **macOS** with Accessibility permissions (for GUI tools)
  - **Linux terminal-only host** (for `terminal_exec`)
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

### Linux: static-pages deploy as `www-data`

A common pattern is to run Connector as **`www-data`** and drive a **static-pages** git checkout for build/deploy. The MCP tool module (`static_pages_*`), nginx examples, and the seed script live in the separate **`static-pages-host`** repo (not in this tree). Connector only needs `CONNECTOR_TOOL_MODULES` pointing at the module file.

If the git working tree were only under another user’s home directory, **`www-data`** would hit **`Permission denied`** on `.git/index.lock`. Instead, mirror the repo under **`/var/lib/connector-tools/`** (owned by **`www-data`**):

```
/var/lib/connector-tools/
├── static-pages/              # git mirror only (not your $HOME clone)
├── static-pages-deploy.mjs    # copied by seed script; CONNECTOR_TOOL_MODULES points here
├── package.json               # minimal deps for the module (zod)
└── node_modules/
```

1. **Seed or refresh** (run as root). From your **`static-pages-host`** checkout:

   ```bash
   cd /path/to/static-pages-host
   sudo ./seed-static-pages-for-www-data.sh /path/to/your/static-pages
   ```

   Default source is **`$HOME/static-pages`**. The script **`rsync --delete`**s into **`static-pages/`**, then runs **`git reset --hard HEAD`** and **`git clean -fd`** so the mirror is a **clean checkout** (untracked junk from a dev clone is removed; gitignored paths such as **`node_modules`** stay).

   If you see **`getcwd`** / rsync errors, your shell’s cwd may have been deleted — **`cd /`** (or a new shell) and run again.

2. **Point Connector** at the installed module ( **`www-data`** does not need to read your home or the **`static-pages-host`** tree after seeding):

   ```bash
   CONNECTOR_TOOL_MODULES=/var/lib/connector-tools/static-pages-deploy.mjs
   ```

   The module defaults **`STATIC_PAGES_REPO`** to **`/var/lib/connector-tools/static-pages`** when that path contains **`.git`**, else **`~/static-pages`**. Override with **`STATIC_PAGES_REPO`** / **`STATIC_PAGES_DEPLOY`** / **`STATIC_PAGES_DEBUG`** as needed (see **`static-pages-host`** README).

3. **`git pull` / remote:** The mirror keeps your existing **`origin`**. **`www-data`** needs SSH (or HTTPS) credentials for that remote — on Debian/Ubuntu, **`HOME` is `/var/www`**, so **`/var/www/.ssh`** must exist and hold a trusted key; see **`static-pages-host`** README. Otherwise re-seed from a user that can fetch.

4. **Build tools:** Put **`just`** on **`PATH`** for the Connector process (e.g. **`/usr/local/bin`**). static-pages builds need **Node 20+** / **npm 10+**; the **`static-pages-host`** deploy module prepends **`/opt/node20/bin`** when installed there, and sets a writable **`npm_config_cache`** under **`/var/lib/connector-tools/`** so **`www-data`** is not blocked by **`/var/www/.npm`** (see that repo’s README). Tool **`timeoutMs`** values there are **milliseconds** (Node `execFile`); the MCP **client** may also stop waiting before a long build finishes.

**Local dev (no seed):** install deps in **`static-pages-host`** (`npm install` there), then run Connector with an absolute path to the module in that repo, e.g. **`CONNECTOR_TOOL_MODULES=/path/to/static-pages-host/static-pages-deploy.mjs`**.

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
│   ├── linux/
│   │   ├── index.ts            # Linux terminal-only adapter
│   │   └── terminal.ts         # Bash command execution
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

Execute a shell command on terminal-only Linux hosts.

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
