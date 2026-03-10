/**
 * macOS alert/dialog and notification detection via JXA.
 */

import { exec } from "../../helpers/exec.js";
import type { AlertInfo, NotificationInfo } from "../types.js";

function runJxa(script: string): Promise<string> {
  return exec("osascript", ["-l", "JavaScript", "-e", script]).then(r => r.stdout);
}

export async function getAlerts(): Promise<AlertInfo[]> {
  const script = `
var se = Application('System Events');
var alerts = [];
var procs = se.processes.whose({backgroundOnly: false})();
for (var i = 0; i < procs.length; i++) {
  var proc = procs[i];
  try {
    var wins = proc.windows();
    for (var j = 0; j < wins.length; j++) {
      var win = wins[j];
      var role = win.role();
      if (role === 'AXSheet' || role === 'AXDialog') {
        var buttons = [];
        try {
          var btns = win.buttons();
          for (var k = 0; k < btns.length; k++) {
            buttons.push(btns[k].title());
          }
        } catch(e) {}
        alerts.push({
          appName: proc.name(),
          appPid: proc.unixId(),
          title: win.title() || '',
          message: '',
          buttons: buttons
        });
      }
    }
    // Also check for sheets within windows
    for (var j = 0; j < wins.length; j++) {
      try {
        var sheets = wins[j].sheets();
        for (var s = 0; s < sheets.length; s++) {
          var buttons = [];
          try {
            var btns = sheets[s].buttons();
            for (var k = 0; k < btns.length; k++) {
              buttons.push(btns[k].title());
            }
          } catch(e) {}
          alerts.push({
            appName: proc.name(),
            appPid: proc.unixId(),
            title: sheets[s].title() || '',
            message: '',
            buttons: buttons
          });
        }
      } catch(e) {}
    }
  } catch(e) {}
}
JSON.stringify(alerts);
`;
  const result = await runJxa(script);
  return result.trim() ? JSON.parse(result.trim()) : [];
}

export async function getNotifications(): Promise<NotificationInfo[]> {
  const script = `
var se = Application('System Events');
var nc = se.processes.byName('NotificationCenter');
var notifications = [];
try {
  var wins = nc.windows();
  for (var i = 0; i < wins.length; i++) {
    var groups = wins[i].groups();
    for (var j = 0; j < groups.length; j++) {
      var texts = groups[j].staticTexts();
      var title = texts.length > 0 ? texts[0].value() : '';
      var message = texts.length > 1 ? texts[1].value() : '';
      notifications.push({
        appName: '',
        title: title,
        message: message,
        timestamp: new Date().toISOString()
      });
    }
  }
} catch(e) {}
JSON.stringify(notifications);
`;
  const result = await runJxa(script);
  return result.trim() ? JSON.parse(result.trim()) : [];
}
