/**
 * screenshot tool — captures the screen and returns a base64-encoded PNG image.
 */
import { z } from "zod";
export function registerScreenshotTool(server, platform) {
    server.tool("screenshot", "Capture a screenshot of the screen. Returns a PNG image. Optionally specify a display ID for multi-monitor setups.", {
        displayId: z.number().int().positive().optional().describe("Display ID to capture. Omit for the main display."),
    }, async ({ displayId }) => {
        const result = await platform.captureScreen(displayId);
        return {
            content: [
                {
                    type: "image",
                    data: result.data,
                    mimeType: result.mimeType,
                },
                {
                    type: "text",
                    text: `Screenshot captured: ${result.width}x${result.height} pixels`,
                },
            ],
        };
    });
}
//# sourceMappingURL=screenshot.js.map