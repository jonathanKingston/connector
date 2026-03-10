/**
 * macOS application and window management using System Events via osascript JXA.
 */
import { exec } from "../../helpers/exec.js";
/**
 * Run a JXA script and return its stdout (parsed as JSON).
 */
async function runJxaJson(script) {
    const { stdout } = await exec("osascript", ["-l", "JavaScript", "-e", script], 15_000);
    return JSON.parse(stdout.trim());
}
export async function listApplications() {
    const script = `
var se = Application('System Events');
var procs = se.processes.whose({backgroundOnly: false})();
var results = [];

for (var i = 0; i < procs.length; i++) {
  var p = procs[i];
  var info = {
    name: '',
    bundleId: '',
    pid: 0,
    isActive: false
  };

  try { info.name = p.name(); } catch(e) {}
  try { info.bundleId = p.bundleIdentifier() || ''; } catch(e) {}
  try { info.pid = p.unixId(); } catch(e) {}
  try { info.isActive = p.frontmost(); } catch(e) {}

  results.push(info);
}

JSON.stringify(results);
`;
    return runJxaJson(script);
}
export async function activateApplication(bundleIdOrName) {
    // Try bundle ID first (com.apple.Safari format), fall back to name
    const escaped = bundleIdOrName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = `
var target = "${escaped}";
var app;
try {
  // Try as bundle ID
  app = Application.currentApplication();
  app.includeStandardAdditions = true;
  var se = Application('System Events');
  var procs = se.processes.whose({bundleIdentifier: target})();
  if (procs.length > 0) {
    procs[0].frontmost = true;
  } else {
    // Try as app name
    var byName = se.processes.whose({name: target})();
    if (byName.length > 0) {
      byName[0].frontmost = true;
    } else {
      throw new Error('Application not found: ' + target);
    }
  }
} catch(e) {
  // Last resort: try to launch/activate by name
  try {
    Application(target).activate();
  } catch(e2) {
    throw new Error('Could not activate application: ' + target + '. ' + e2.message);
  }
}
`;
    await exec("osascript", ["-l", "JavaScript", "-e", script]);
}
export async function listWindows() {
    const script = `
var se = Application('System Events');
var procs = se.processes.whose({backgroundOnly: false})();
var results = [];

for (var i = 0; i < procs.length; i++) {
  var proc = procs[i];
  var procName = '';
  var procPid = 0;

  try { procName = proc.name(); } catch(e) { continue; }
  try { procPid = proc.unixId(); } catch(e) {}

  try {
    var windows = proc.windows();
    for (var j = 0; j < windows.length; j++) {
      var win = windows[j];
      var info = {
        id: j,
        title: '',
        appName: procName,
        appPid: procPid,
        bounds: {x: 0, y: 0, width: 0, height: 0},
        isMinimized: false,
        isFullscreen: false
      };

      try { info.title = win.title() || ''; } catch(e) {}
      try {
        var pos = win.position();
        var sz = win.size();
        if (pos && sz) {
          info.bounds = {x: pos[0], y: pos[1], width: sz[0], height: sz[1]};
        }
      } catch(e) {}
      try { info.isMinimized = win.minimized(); } catch(e) {}
      try {
        // Check if AXFullScreen attribute exists and is true
        var attrs = win.attributes.byName('AXFullScreen');
        info.isFullscreen = attrs.value();
      } catch(e) {}

      results.push(info);
    }
  } catch(e) {}
}

JSON.stringify(results);
`;
    return runJxaJson(script);
}
//# sourceMappingURL=applications.js.map