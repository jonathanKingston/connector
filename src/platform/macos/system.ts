/**
 * macOS system info and health check implementations.
 */

import { exec } from "../../helpers/exec.js";
import { hostname, userInfo, uptime } from "node:os";
import type { SystemInfo } from "../types.js";

export async function getSystemInfo(): Promise<SystemInfo> {
  // Get macOS version
  const { stdout: versionStr } = await exec("sw_vers", ["-productVersion"]);

  // Get screen resolution via JXA
  const { stdout: resolutionStr } = await exec("osascript", ["-l", "JavaScript", "-e", `
ObjC.import('CoreGraphics');
var mainDisplay = $.CGMainDisplayID();
JSON.stringify({
  width: $.CGDisplayPixelsWide(mainDisplay),
  height: $.CGDisplayPixelsHigh(mainDisplay)
});
`]);
  const resolution = JSON.parse(resolutionStr.trim());

  // Check if screen is locked
  let isScreenLocked = false;
  try {
    const { stdout: lockStr } = await exec("osascript", ["-l", "JavaScript", "-e", `
ObjC.import('Quartz');
var session = $.CGSessionCopyCurrentDictionary();
var locked = ObjC.deepUnwrap(session)['CGSSessionScreenIsLocked'];
JSON.stringify(locked === 1);
`]);
    isScreenLocked = JSON.parse(lockStr.trim());
  } catch {
    // If we can't determine, assume not locked
  }

  // Battery info (may fail on desktops)
  let batteryState: SystemInfo["batteryState"];
  try {
    const { stdout: batteryStr } = await exec("pmset", ["-g", "batt"]);
    const levelMatch = batteryStr.match(/(\d+)%/);
    const isCharging = batteryStr.includes("charging") && !batteryStr.includes("not charging");
    const isPluggedIn = batteryStr.includes("AC Power");
    if (levelMatch) {
      batteryState = {
        level: parseInt(levelMatch[1], 10),
        isCharging,
        isPluggedIn,
      };
    }
  } catch {
    // No battery (desktop Mac)
  }

  return {
    os: "macOS",
    osVersion: versionStr.trim(),
    hostname: hostname(),
    username: userInfo().username,
    uptime: uptime(),
    screenResolution: resolution,
    isScreenLocked,
    batteryState,
  };
}

export async function healthCheck(): Promise<{ status: "ok"; timestamp: string; latencyMs: number }> {
  const start = Date.now();
  // Quick sanity check - can we run osascript?
  await exec("osascript", ["-l", "JavaScript", "-e", "1+1"]);
  const latencyMs = Date.now() - start;
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
    latencyMs,
  };
}
