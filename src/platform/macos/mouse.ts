/**
 * macOS mouse control using CoreGraphics CGEvent via osascript JXA with ObjC bridge.
 *
 * This avoids any third-party binaries — uses only the built-in osascript command
 * with JavaScript for Automation (JXA) and the Objective-C bridge to CoreGraphics.
 */

import { exec } from "../../helpers/exec.js";
import type { MouseClickOptions, MouseMoveOptions, MouseDragOptions, MouseScrollOptions } from "../types.js";

/**
 * Run a JXA script via osascript.
 */
function runJxa(script: string): Promise<void> {
  return exec("osascript", ["-l", "JavaScript", "-e", script]).then(() => {});
}

/**
 * Map our button names to CGEvent button constants and event types.
 */
function buttonParams(button: string): {
  mouseButton: number;
  downType: number;
  upType: number;
  dragType: number;
} {
  switch (button) {
    case "right":
      return {
        mouseButton: 1, // kCGMouseButtonRight
        downType: 3,     // kCGEventRightMouseDown
        upType: 4,       // kCGEventRightMouseUp
        dragType: 8,     // kCGEventRightMouseDragged
      };
    case "middle":
      return {
        mouseButton: 2, // kCGMouseButtonCenter
        downType: 25,    // kCGEventOtherMouseDown
        upType: 26,      // kCGEventOtherMouseUp
        dragType: 27,    // kCGEventOtherMouseDragged
      };
    case "left":
    default:
      return {
        mouseButton: 0, // kCGMouseButtonLeft
        downType: 1,     // kCGEventLeftMouseDown
        upType: 2,       // kCGEventLeftMouseUp
        dragType: 6,     // kCGEventLeftMouseDragged
      };
  }
}

export async function mouseClick(options: MouseClickOptions): Promise<void> {
  const { x, y, button, clickCount } = options;
  const bp = buttonParams(button);

  // For multi-click, we set the click state integer on each event pair.
  // CGEvent clickState: 1 = single, 2 = double, 3 = triple
  const script = `
ObjC.import('CoreGraphics');
var point = {x: ${x}, y: ${y}};
for (var i = 1; i <= ${clickCount}; i++) {
  var down = $.CGEventCreateMouseEvent($(), ${bp.downType}, point, ${bp.mouseButton});
  $.CGEventSetIntegerValueField(down, 1, i);
  $.CGEventPost($.kCGHIDEventTap, down);
  var up = $.CGEventCreateMouseEvent($(), ${bp.upType}, point, ${bp.mouseButton});
  $.CGEventSetIntegerValueField(up, 1, i);
  $.CGEventPost($.kCGHIDEventTap, up);
}
`;

  await runJxa(script);
}

export async function mouseMove(options: MouseMoveOptions): Promise<void> {
  const { x, y } = options;

  const script = `
ObjC.import('CoreGraphics');
var point = {x: ${x}, y: ${y}};
var event = $.CGEventCreateMouseEvent($(), 5, point, 0);
$.CGEventPost($.kCGHIDEventTap, event);
`;

  await runJxa(script);
}

export async function mouseDrag(options: MouseDragOptions): Promise<void> {
  const { startX, startY, endX, endY, button, waypoints, speed } = options;
  const bp = buttonParams(button);

  // Build all points: start -> waypoints -> end
  const allPoints = [
    { x: startX, y: startY },
    ...(waypoints || []),
    { x: endX, y: endY },
  ];

  // Generate drag events through all points
  let dragCommands = "";
  for (let i = 1; i < allPoints.length; i++) {
    const p = allPoints[i];
    const delayMs = speed === "slow" ? 100 : speed === "normal" ? 20 : 0;
    dragCommands += `
var drag${i} = $.CGEventCreateMouseEvent($(), ${bp.dragType}, {x: ${p.x}, y: ${p.y}}, ${bp.mouseButton});
$.CGEventPost($.kCGHIDEventTap, drag${i});
${delayMs > 0 ? `delay(${delayMs / 1000});` : ""}`;
  }

  const lastPoint = allPoints[allPoints.length - 1];
  const script = `
ObjC.import('CoreGraphics');
var startPoint = {x: ${startX}, y: ${startY}};
var endPoint = {x: ${lastPoint.x}, y: ${lastPoint.y}};

var down = $.CGEventCreateMouseEvent($(), ${bp.downType}, startPoint, ${bp.mouseButton});
$.CGEventPost($.kCGHIDEventTap, down);
${dragCommands}
var up = $.CGEventCreateMouseEvent($(), ${bp.upType}, endPoint, ${bp.mouseButton});
$.CGEventPost($.kCGHIDEventTap, up);
`;

  await runJxa(script);
}

export async function mouseScroll(options: MouseScrollOptions): Promise<void> {
  const { x, y, deltaX, deltaY } = options;

  const script = `
ObjC.import('CoreGraphics');
var point = {x: ${x}, y: ${y}};
var move = $.CGEventCreateMouseEvent($(), 5, point, 0);
$.CGEventPost($.kCGHIDEventTap, move);
var scroll = $.CGEventCreateScrollWheelEvent($(), 0, 2, ${-deltaY}, ${-deltaX});
$.CGEventPost($.kCGHIDEventTap, scroll);
`;

  await runJxa(script);
}
