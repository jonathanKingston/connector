/**
 * macOS accessibility tree inspection using System Events via osascript JXA.
 *
 * Provides:
 * - getAccessibilityTree: Recursively enumerate UI elements for a process
 * - getMenuBar: List all menu bar items and their sub-menus
 * - clickMenuItem: Navigate a menu path and click the target item
 */

import { exec } from "../../helpers/exec.js";
import type { UIElement, MenuBarItem, MenuItem } from "../types.js";

const DEFAULT_MAX_DEPTH = 3;

/**
 * Run a JXA script and return its stdout (parsed as JSON).
 */
async function runJxaJson<T>(script: string): Promise<T> {
  const { stdout } = await exec("osascript", ["-l", "JavaScript", "-e", script], 30_000);
  return JSON.parse(stdout.trim()) as T;
}

/**
 * Run a JXA script (no return value needed).
 */
function runJxa(script: string): Promise<void> {
  return exec("osascript", ["-l", "JavaScript", "-e", script], 30_000).then(() => {});
}

export async function getAccessibilityTree(
  pid: number,
  maxDepth: number = DEFAULT_MAX_DEPTH,
): Promise<UIElement> {
  // The JXA script recursively walks UI elements up to maxDepth.
  // It runs inside osascript so it has native access to System Events.
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];

function getElement(el, depth, maxDepth) {
  var result = {
    role: '',
    title: null,
    value: null,
    description: null,
    enabled: true,
    position: null,
    size: null,
    children: []
  };

  try { result.role = el.role(); } catch(e) {}
  try { var t = el.title(); if (t !== undefined && t !== null) result.title = String(t); } catch(e) {}
  try { var v = el.value(); if (v !== undefined && v !== null) result.value = String(v); } catch(e) {}
  try { var d = el.description(); if (d !== undefined && d !== null) result.description = String(d); } catch(e) {}
  try { result.enabled = el.enabled(); } catch(e) {}

  try {
    var pos = el.position();
    if (pos) result.position = {x: pos[0], y: pos[1]};
  } catch(e) {}

  try {
    var sz = el.size();
    if (sz) result.size = {width: sz[0], height: sz[1]};
  } catch(e) {}

  if (depth < maxDepth) {
    try {
      var children = el.uiElements();
      for (var i = 0; i < children.length; i++) {
        result.children.push(getElement(children[i], depth + 1, maxDepth));
      }
    } catch(e) {}
  }

  return result;
}

JSON.stringify(getElement(proc, 0, ${maxDepth}));
`;

  return runJxaJson<UIElement>(script);
}

export async function getMenuBar(pid: number): Promise<MenuBarItem[]> {
  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];

function getMenuItem(item) {
  var result = {
    title: '',
    enabled: true,
    shortcut: null,
    children: []
  };

  try { result.title = item.title() || ''; } catch(e) {}
  try { result.enabled = item.enabled(); } catch(e) {}
  try {
    var shortcut = item.keyboardShortcut();
    if (shortcut) result.shortcut = shortcut;
  } catch(e) {}

  try {
    var subMenus = item.menus();
    if (subMenus && subMenus.length > 0) {
      var subItems = subMenus[0].menuItems();
      for (var i = 0; i < subItems.length; i++) {
        result.children.push(getMenuItem(subItems[i]));
      }
    }
  } catch(e) {}

  return result;
}

var menuBar = proc.menuBars[0];
var items = menuBar.menuBarItems();
var results = [];

for (var i = 0; i < items.length; i++) {
  var menuBarItem = {
    title: '',
    children: []
  };

  try { menuBarItem.title = items[i].title() || ''; } catch(e) {}

  try {
    var menus = items[i].menus();
    if (menus && menus.length > 0) {
      var menuItems = menus[0].menuItems();
      for (var j = 0; j < menuItems.length; j++) {
        menuBarItem.children.push(getMenuItem(menuItems[j]));
      }
    }
  } catch(e) {}

  results.push(menuBarItem);
}

JSON.stringify(results);
`;

  return runJxaJson<MenuBarItem[]>(script);
}

export async function clickMenuItem(pid: number, menuPath: string[]): Promise<void> {
  if (menuPath.length === 0) {
    throw new Error("menuPath must contain at least one item");
  }

  // Build a JXA script that navigates the menu path and clicks the final item.
  // Path example: ["File", "Save As..."] clicks File menu → Save As... item.
  const pathJson = JSON.stringify(menuPath);

  const script = `
var se = Application('System Events');
var proc = se.processes.whose({unixId: ${pid}})[0];
var menuPath = ${pathJson};

var menuBarItem = proc.menuBars[0].menuBarItems.byName(menuPath[0]);
menuBarItem.click();

var current = menuBarItem.menus[0];
for (var i = 1; i < menuPath.length; i++) {
  var item = current.menuItems.byName(menuPath[i]);
  if (i < menuPath.length - 1) {
    // Navigate into sub-menu
    item.click();
    current = item.menus[0];
  } else {
    // Click the final item
    item.click();
  }
}
`;

  await runJxa(script);
}
