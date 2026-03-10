/**
 * macOS window management via JXA (JavaScript for Automation) and System Events.
 */

import { exec } from "../../helpers/exec.js";

function runJxa(script: string): Promise<void> {
  return exec("osascript", ["-l", "JavaScript", "-e", script]).then(() => {});
}

export async function moveWindow(pid: number, windowIndex: number, x: number, y: number): Promise<void> {
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];
proc.windows[${windowIndex}].position = [${x}, ${y}];
`;
  await runJxa(script);
}

export async function resizeWindow(pid: number, windowIndex: number, width: number, height: number): Promise<void> {
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];
proc.windows[${windowIndex}].size = [${width}, ${height}];
`;
  await runJxa(script);
}

export async function minimizeWindow(pid: number, windowIndex: number, minimize: boolean): Promise<void> {
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];
var win = proc.windows[${windowIndex}];
win.attributes.byName('AXMinimized').value = ${minimize};
`;
  await runJxa(script);
}

export async function setFullscreen(pid: number, windowIndex: number, fullscreen: boolean): Promise<void> {
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];
var win = proc.windows[${windowIndex}];
win.attributes.byName('AXFullScreen').value = ${fullscreen};
`;
  await runJxa(script);
}
