/**
 * macOS keyboard control using System Events via osascript JXA.
 *
 * Uses two approaches:
 * - keyboardType: System Events keystroke for typing text strings
 * - keyboardKey: System Events key code for special keys with modifiers
 */
import type { KeyboardTypeOptions, KeyboardKeyOptions } from "../types.js";
export declare function keyboardType(options: KeyboardTypeOptions): Promise<void>;
export declare function keyboardKey(options: KeyboardKeyOptions): Promise<void>;
//# sourceMappingURL=keyboard.d.ts.map