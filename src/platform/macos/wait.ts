import type { PlatformAdapter, UIElement, WindowInfo, WaitForElementOptions, WaitForWindowOptions } from "../types.js";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findElement(node: UIElement, role?: string, titleContains?: string, valueContains?: string): UIElement | null {
  const roleMatch = !role || node.role === role;
  const titleMatch = !titleContains || (node.title && node.title.includes(titleContains));
  const valueMatch = !valueContains || (node.value && String(node.value).includes(valueContains));
  if (roleMatch && titleMatch && valueMatch) return node;
  for (const child of node.children) {
    const found = findElement(child, role, titleContains, valueContains);
    if (found) return found;
  }
  return null;
}

export async function waitForElement(
  platform: PlatformAdapter,
  options: WaitForElementOptions,
): Promise<UIElement | null> {
  const timeout = options.timeout ?? 10000;
  const interval = options.interval ?? 500;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const tree = await platform.getAccessibilityTree(options.pid, 10);
      const found = findElement(tree, options.role, options.titleContains, options.valueContains);
      if (found) return found;
    } catch {
      // App might not be ready yet
    }
    if (Date.now() + interval < deadline) {
      await sleep(interval);
    } else {
      break;
    }
  }
  return null;
}

export async function waitForWindow(
  platform: PlatformAdapter,
  options: WaitForWindowOptions,
): Promise<WindowInfo | null> {
  const timeout = options.timeout ?? 10000;
  const interval = options.interval ?? 500;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const windows = await platform.listWindows();
      const found = windows.find(w => w.title.includes(options.titleContains));
      if (found) return found;
    } catch {
      // System might not be ready
    }
    if (Date.now() + interval < deadline) {
      await sleep(interval);
    } else {
      break;
    }
  }
  return null;
}
