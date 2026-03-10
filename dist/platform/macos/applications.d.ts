/**
 * macOS application and window management using System Events via osascript JXA.
 */
import type { AppInfo, WindowInfo } from "../types.js";
export declare function listApplications(): Promise<AppInfo[]>;
export declare function activateApplication(bundleIdOrName: string): Promise<void>;
export declare function listWindows(): Promise<WindowInfo[]>;
//# sourceMappingURL=applications.d.ts.map