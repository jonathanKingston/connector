/**
 * Mouse control tools — click, move, and drag.
 */
import { z } from "zod";
export function registerMouseTools(server, platform) {
    // ── mouse_click ─────────────────────────────────────────────────────────
    server.tool("mouse_click", "Click the mouse at the given screen coordinates. Supports left, right, and middle button, and single, double, or triple click.", {
        x: z.number().describe("X coordinate (pixels from left edge of screen)"),
        y: z.number().describe("Y coordinate (pixels from top edge of screen)"),
        button: z
            .enum(["left", "right", "middle"])
            .default("left")
            .describe("Mouse button to click"),
        clickCount: z
            .union([z.literal(1), z.literal(2), z.literal(3)])
            .default(1)
            .describe("Number of clicks (1=single, 2=double, 3=triple)"),
    }, async ({ x, y, button, clickCount }) => {
        await platform.mouseClick({
            x,
            y,
            button: button,
            clickCount: clickCount,
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Clicked ${button} button ${clickCount}x at (${x}, ${y})`,
                },
            ],
        };
    });
    // ── mouse_move ──────────────────────────────────────────────────────────
    server.tool("mouse_move", "Move the mouse cursor to the given screen coordinates without clicking.", {
        x: z.number().describe("X coordinate (pixels from left edge of screen)"),
        y: z.number().describe("Y coordinate (pixels from top edge of screen)"),
    }, async ({ x, y }) => {
        await platform.mouseMove({ x, y });
        return {
            content: [
                {
                    type: "text",
                    text: `Moved mouse to (${x}, ${y})`,
                },
            ],
        };
    });
    // ── mouse_drag ──────────────────────────────────────────────────────────
    server.tool("mouse_drag", "Drag the mouse from one point to another. Press down at (startX, startY), drag to (endX, endY), then release.", {
        startX: z.number().describe("Starting X coordinate"),
        startY: z.number().describe("Starting Y coordinate"),
        endX: z.number().describe("Ending X coordinate"),
        endY: z.number().describe("Ending Y coordinate"),
        button: z
            .enum(["left", "right", "middle"])
            .default("left")
            .describe("Mouse button to hold during drag"),
    }, async ({ startX, startY, endX, endY, button }) => {
        await platform.mouseDrag({
            startX,
            startY,
            endX,
            endY,
            button: button,
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Dragged ${button} button from (${startX}, ${startY}) to (${endX}, ${endY})`,
                },
            ],
        };
    });
}
//# sourceMappingURL=mouse.js.map