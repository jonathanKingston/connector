/**
 * macOS mouse control using CoreGraphics CGEvent via osascript JXA with ObjC bridge.
 *
 * This avoids any third-party binaries — uses only the built-in osascript command
 * with JavaScript for Automation (JXA) and the Objective-C bridge to CoreGraphics.
 */
import type { MouseClickOptions, MouseMoveOptions, MouseDragOptions } from "../types.js";
export declare function mouseClick(options: MouseClickOptions): Promise<void>;
export declare function mouseMove(options: MouseMoveOptions): Promise<void>;
export declare function mouseDrag(options: MouseDragOptions): Promise<void>;
//# sourceMappingURL=mouse.d.ts.map