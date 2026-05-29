# Windows Connector Status and Gaps

## Why this exists

The Windows platform adapter currently exposes process / shell execution and full
screen capture, but not the GUI input or accessibility surface that the macOS
adapter provides. This note records what is missing and what a follow-up should
add, so an agent or contributor working on Windows GUI automation knows where to
start.

## Current Windows support

Implemented:

- `screenshot` (GDI+ full primary or per-display capture)
- `terminal_exec` (PowerShell, strict `$ErrorActionPreference = 'Stop'`,
  `-EncodedCommand` to avoid quoting issues)

Not implemented:

- mouse input (`mouse_click`, `mouse_move`, `mouse_drag`)
- keyboard input (`keyboard_type`, `keyboard_key`)
- application listing / activation
- window listing / activation
- accessibility / UI Automation inspection
- menu traversal

The unimplemented operations throw a clear "not implemented on Windows" error via
the adapter so callers fail fast instead of silently no-oping. The capability
flags on `WindowsAdapter` reflect this, and the built-in tool registration skips
unsupported groups based on those flags.

## What this blocks

Driving a GUI session on Windows currently requires at minimum:

1. Keyboard injection (type text, send a named key with modifiers).
2. Mouse injection (click at coordinates, move, drag).
3. Window targeting (enumerate top-level windows, activate one by hwnd / pid /
   title).
4. Some inspection surface to know where input should go without relying solely
   on screenshot pixel inference.
5. Optional: diagnostics to explain when input fails (session id, interactive
   desktop, lock state, integrity level, foreground window).

Without these, the agent can launch processes and run shell commands on Windows
but cannot reliably drive a UI after launch.

## Suggested follow-up work, in priority order

### Priority 1: input parity

Add Windows implementations for:

- `mouse_click`, `mouse_move`, `mouse_drag`
- `keyboard_type`, `keyboard_key`

Guidance:

- Prefer Win32 `SendInput` for synthetic input.
- Avoid `SendKeys` for core support — it is locale / focus sensitive and does not
  work in non-interactive contexts.
- Return explicit, structured errors when the target desktop / session cannot
  receive input, rather than generic "access denied".

### Priority 2: window / app targeting

Add:

- `list_windows`
- `activate_application`
- a window activation helper by hwnd / pid / title

Returned data per window should at least cover hwnd / id, title, pid, process
name, bounds, minimized / visible state, and a foreground flag — matching the
macOS `WindowInfo` shape in `src/platform/types.ts`.

### Priority 3: accessibility / UI Automation

Implement Windows UIA-backed equivalents for:

- `get_accessibility_tree`
- a focused-element helper
- invoke / set value for common controls

If full parity is too much initially, start with the foreground window root,
focused element, and subtree search by role / name.

### Priority 4: screenshot hardening

The current capture path uses `Graphics.CopyFromScreen` against the primary
display. Useful improvements:

- detect non-interactive / locked desktop and surface a structured error
- include diagnostic context (session id, foreground window, desktop name)
- optionally capture a specific window via `PrintWindow`
- consider DXGI / Desktop Duplication if richer multi-monitor support is needed

### Priority 5: session diagnostics

Expose a tool or API that reports current session id, console / RDP session id,
desktop name, lock state if detectable, integrity level, and foreground window
details. This makes failures actionable instead of opaque.

## Layering note

Some of the above (session diagnostics, screenshot diagnostics) make sense in
connector core. Workflow-specific helpers (browser harnesses, host-file edits,
local cert trust, capture servers) belong in setup-specific tool modules loaded
via `CONNECTOR_TOOL_MODULES` rather than connector core — see
[`examples/custom-tools/setup-tools.mjs`](./examples/custom-tools/setup-tools.mjs)
for the module shape.
