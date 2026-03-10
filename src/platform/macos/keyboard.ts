/**
 * macOS keyboard control using System Events via osascript JXA.
 *
 * Uses two approaches:
 * - keyboardType: System Events keystroke for typing text strings
 * - keyboardKey: System Events key code for special keys with modifiers
 */

import { exec } from "../../helpers/exec.js";
import type { KeyboardTypeOptions, KeyboardKeyOptions, KeyModifier } from "../types.js";

/**
 * Run a JXA script via osascript.
 */
function runJxa(script: string): Promise<void> {
  return exec("osascript", ["-l", "JavaScript", "-e", script]).then(() => {});
}

/**
 * Mapping of key names to macOS virtual key codes.
 * See: https://developer.apple.com/documentation/coregraphics/cgkeycodes
 */
const KEY_CODES: Record<string, number> = {
  // Letters
  a: 0, s: 1, d: 2, f: 3, h: 4, g: 5, z: 6, x: 7, c: 8, v: 9,
  b: 11, q: 12, w: 13, e: 14, r: 15, y: 16, t: 17, o: 31, u: 32,
  i: 34, p: 35, l: 37, j: 38, k: 40, n: 45, m: 46,

  // Numbers
  "0": 29, "1": 18, "2": 19, "3": 20, "4": 21,
  "5": 23, "6": 22, "7": 26, "8": 28, "9": 25,

  // Special keys
  return: 36, enter: 36, tab: 48, space: 49, delete: 51, backspace: 51,
  escape: 53, esc: 53,

  // Modifiers (as standalone keys)
  command: 55, shift: 56, capslock: 57, option: 58, alt: 58, control: 59,
  rightcommand: 54, rightshift: 60, rightoption: 61, rightcontrol: 62,
  fn: 63,

  // Navigation
  left: 123, right: 124, down: 125, up: 126,
  home: 115, end: 119, pageup: 116, pagedown: 121,

  // Function keys
  f1: 122, f2: 120, f3: 99, f4: 118, f5: 96, f6: 97,
  f7: 98, f8: 100, f9: 101, f10: 109, f11: 103, f12: 111,
  f13: 105, f14: 107, f15: 113, f16: 106, f17: 64, f18: 79,
  f19: 80, f20: 90,

  // Editing
  forwarddelete: 117,

  // Punctuation & symbols
  "-": 27, "=": 24, "[": 33, "]": 30, "\\": 42, ";": 41,
  "'": 39, ",": 43, ".": 47, "/": 44, "`": 50,
};

/**
 * Map our modifier names to the System Events "using" specifier strings.
 */
const MODIFIER_MAP: Record<KeyModifier, string> = {
  command: "command down",
  control: "control down",
  option: "option down",
  shift: "shift down",
  fn: "fn down",
};

export async function keyboardType(options: KeyboardTypeOptions): Promise<void> {
  const { text } = options;
  // Escape the text for embedding in a JXA string
  const escaped = text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");

  const script = `
var se = Application('System Events');
se.keystroke("${escaped}");
`;

  await runJxa(script);
}

export async function keyboardKey(options: KeyboardKeyOptions): Promise<void> {
  const { key, modifiers } = options;
  const keyLower = key.toLowerCase();
  const keyCode = KEY_CODES[keyLower];

  if (keyCode === undefined) {
    throw new Error(
      `Unknown key: "${key}". Supported keys: ${Object.keys(KEY_CODES).join(", ")}`,
    );
  }

  if (modifiers.length === 0) {
    const script = `
var se = Application('System Events');
se.keyCode(${keyCode});
`;
    await runJxa(script);
  } else {
    const modifierList = modifiers
      .map((m) => {
        const mapped = MODIFIER_MAP[m];
        if (!mapped) {
          throw new Error(
            `Unknown modifier: "${m}". Supported: ${Object.keys(MODIFIER_MAP).join(", ")}`,
          );
        }
        return `"${mapped}"`;
      })
      .join(", ");

    const script = `
var se = Application('System Events');
se.keyCode(${keyCode}, { using: [${modifierList}] });
`;
    await runJxa(script);
  }
}
