/**
 * macOS display enumeration via CoreGraphics (JXA).
 */

import { exec } from "../../helpers/exec.js";
import type { DisplayInfo } from "../types.js";

export async function listDisplays(): Promise<DisplayInfo[]> {
  const script = `
ObjC.import('CoreGraphics');
ObjC.import('Foundation');

var maxDisplays = 16;
var displayCount = Ref();
var displayIDs = Ref();
$.CGGetActiveDisplayList(maxDisplays, displayIDs, displayCount);
var count = displayCount[0];

var displays = [];
for (var i = 0; i < count; i++) {
  var id = displayIDs[i];
  var bounds = $.CGDisplayBounds(id);
  var pw = $.CGDisplayPixelsWide(id);
  var ph = $.CGDisplayPixelsHigh(id);
  var w = bounds.size.width;
  var h = bounds.size.height;
  var scale = pw / w;
  displays.push({
    id: id,
    width: w,
    height: h,
    pixelWidth: pw,
    pixelHeight: ph,
    scaleFactor: scale,
    position: { x: bounds.origin.x, y: bounds.origin.y },
    isMain: $.CGDisplayIsMain(id) === 1
  });
}
JSON.stringify(displays);
`;
  const { stdout } = await exec("osascript", ["-l", "JavaScript", "-e", script]);
  return JSON.parse(stdout.trim());
}
