# Windows Connector Gap Outline and Restart Handoff

## Why this exists

During validation of a Windows browser security environment, the connector exposed
enough surface to launch processes and run shell commands, but not enough to drive
or reliably inspect the GUI. This note captures the concrete gaps that blocked the
workflow and what a follow-up agent should have available.

## Missing Windows capabilities in core connector

Current Windows support is:

- `screenshot`
- `terminal_exec`

Current Windows support is **missing**:

- mouse input
- keyboard input
- application listing / activation
- window listing / activation
- accessibility / UI Automation inspection
- menu traversal

Those omissions are already visible in `src/platform/windows/index.ts`, but the
practical impact is larger than the capability flags suggest.

## What blocked the EP validation workflow

### 1. No keyboard injection

The workflow needed reliable equivalents of:

- focus address bar
- type URL
- press Enter
- trigger browser shortcuts such as Ctrl+L

Without `keyboard_type` / `keyboard_key` on Windows, the agent could launch the
browser but could not drive navigation after launch.

### 2. No mouse input

Several proof-of-concept pages required:

- clicking a "Run" button
- moving the pointer to trigger hover-driven payloads
- interacting with popups

Without `mouse_click` / `mouse_move` / `mouse_drag`, any flow that depended on a
button press or hover state was blocked.

### 3. No window targeting

The workflow needed to:

- list top-level windows
- identify the browser window by PID/title
- bring the browser window to foreground
- distinguish the browser from the shell/session desktop

Without `list_windows` and an activation primitive, screenshots and shell launches
were not enough to determine where input should go even if input primitives existed.

### 4. No accessibility/UIA surface

For robust browser driving on Windows, pixel clicks are not enough. The missing
capabilities were:

- inspect focused controls
- find an address bar/edit control
- invoke buttons by role/name
- read element text/state
- wait for UI state changes

This should be backed by Windows UI Automation rather than screenshot inference.

### 5. Screenshot implementation is not resilient enough

The current screenshot path uses `Graphics.CopyFromScreen`. In the validation run,
it intermittently failed with errors equivalent to:

- invalid handle
- non-interactive / inaccessible desktop capture failure

That means the connector needs either:

- a better capture path, or
- better diagnostics when the active desktop cannot be captured

At minimum, Windows screenshots should surface structured failure metadata:

- active session id
- whether the session is interactive
- foreground window handle/title
- desktop name
- monitor list

### 6. No session diagnostics

When remote GUI actions fail on Windows, the agent currently has no first-class way
to answer:

- is there an interactive desktop?
- is the session locked?
- is the process running in the same session as the target app?
- is the foreground window on a different desktop?
- is UAC / integrity level blocking synthetic input?

This is why failures currently look like generic access-denied or invalid-handle
errors instead of actionable environment feedback.

### 7. No browser/task harness helpers

The specific workflow also needed setup helpers around the browser-under-test:

- launch an exe and wait for a visible window
- preserve a transient network-shared environment locally before running it
- start a local HTTP/HTTPS capture server for PoCs
- install / verify host aliases for test domains
- trust a self-signed cert for local HTTPS repro

Some of these belong in setup-specific tool modules rather than connector core, but
the connector should make them easy to layer in.

## Recommended core Windows work, in priority order

### Priority 1: input parity

Add real Windows implementations for:

- `mouse_click`
- `mouse_move`
- `mouse_drag`
- `keyboard_type`
- `keyboard_key`

Implementation guidance:

- Prefer `SendInput` or equivalent Win32 APIs.
- Do **not** rely on `SendKeys` for core support.
- Return explicit errors when the target desktop/session cannot receive input.

### Priority 2: window/app targeting

Add:

- `list_windows`
- `activate_application`
- optional window-focused activation helper by hwnd/pid/title

Minimum returned data should include:

- hwnd/id
- title
- pid
- process name
- bounds
- minimized/visible state
- foreground flag

### Priority 3: accessibility / UI Automation

Implement Windows UIA-backed equivalents for:

- `get_accessibility_tree`
- a focused-element helper
- clickable/invokable element targeting

If full parity is too much initially, start with:

- foreground window root
- focused element
- subtree search by role/name
- invoke / set value for common controls

### Priority 4: screenshot hardening

Improve the Windows screenshot path to:

- detect non-interactive desktop cases
- include structured error context
- optionally capture a specific window instead of only the full desktop

Likely useful fallback paths:

- `PrintWindow`
- alternate GDI capture paths
- DXGI/Desktop Duplication if needed later

### Priority 5: session diagnostics

Expose a setup/diagnostics tool or API that reports:

- current process session id
- active console / RDP session id
- desktop name
- lock state if detectable
- integrity level / admin context
- foreground window details

This would have made the blocked run much easier to reason about.

## Recommended resources for the next agent

These do not all need to be built into connector core. Some are better as
setup-specific tool modules loaded via `CONNECTOR_TOOL_MODULES`.

### A. Windows session diagnostics module

Recommended module name:

- `examples/custom-tools/windows-session-tools.mjs`

Suggested tools:

- `windows_session_status`
- `windows_foreground_window`
- `windows_wait_for_window`
- `windows_activate_window`

Purpose:

- quickly tell a new agent whether GUI automation is even possible in the current
  session before it starts attempting repro.

### B. Browser repro harness module

Recommended module name:

- `examples/custom-tools/windows-browser-repro-tools.mjs`

Suggested tools:

- `preserve_environment_copy`
- `start_local_capture_server`
- `install_hosts_aliases`
- `trust_local_test_cert`
- `launch_browser_url`
- `cleanup_browser_profile`

Purpose:

- package the repetitive environment prep that was needed for the EP submission.

### C. Windows restart checklist doc

If only one extra resource is created for handoff, create and keep a checklist that
states:

- required privileges (admin needed for `hosts`, cert import may need elevation)
- local staging path for preserved environments
- exact browser executable path
- required test domains
- expected local ports
- cleanup locations for browser temp/profile state

This document can be used directly by a follow-up agent at startup.

## Recommended restart prerequisites for a new agent

Before retrying the EP workflow, the next agent should verify:

1. the environment has been preserved locally, not run from a transient redirected share
2. the connector exposes at least one of:
   - working mouse + keyboard tools, or
   - working UIA/window targeting tools
3. the session is interactive and capturable
4. test hostnames can be configured
5. local HTTP/HTTPS capture server setup is possible

## Practical short version

The Windows connector is currently missing the exact capabilities needed for
interactive browser validation:

- input
- window targeting
- UIA inspection
- robust screenshot/session diagnostics

For a restart, the fastest path is:

1. keep the environment preserved locally
2. add Windows input + window enumeration in core
3. add a small setup-specific repro module for browser/task setup
4. have the next agent start by reading this file and checking session readiness
