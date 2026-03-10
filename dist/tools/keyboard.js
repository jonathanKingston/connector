/**
 * Keyboard control tools — type text and press keys with modifiers.
 */
import { z } from "zod";
export function registerKeyboardTools(server, platform) {
    // ── keyboard_type ───────────────────────────────────────────────────────
    server.tool("keyboard_type", "Type a string of text as if entered on the keyboard. Use this for entering text into fields, documents, etc.", {
        text: z.string().min(1).describe("The text to type"),
    }, async ({ text }) => {
        await platform.keyboardType({ text });
        return {
            content: [
                {
                    type: "text",
                    text: `Typed ${text.length} character(s)`,
                },
            ],
        };
    });
    // ── keyboard_key ────────────────────────────────────────────────────────
    server.tool("keyboard_key", "Press a specific key, optionally with modifier keys held. Use for keyboard shortcuts (e.g. Cmd+C), special keys (Return, Escape, Tab, arrow keys), function keys, etc.", {
        key: z
            .string()
            .min(1)
            .describe('Key name — e.g. "return", "tab", "escape", "space", "delete", "up", "down", "left", "right", "f1"-"f20", or single characters like "a", "1"'),
        modifiers: z
            .array(z.enum(["command", "control", "option", "shift", "fn"]))
            .default([])
            .describe('Modifier keys to hold while pressing. e.g. ["command", "shift"] for Cmd+Shift+<key>'),
    }, async ({ key, modifiers }) => {
        await platform.keyboardKey({
            key,
            modifiers: modifiers,
        });
        const modStr = modifiers.length > 0 ? modifiers.join("+") + "+" : "";
        return {
            content: [
                {
                    type: "text",
                    text: `Pressed ${modStr}${key}`,
                },
            ],
        };
    });
}
//# sourceMappingURL=keyboard.js.map