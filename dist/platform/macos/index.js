/**
 * macOS platform adapter — delegates to individual module implementations.
 */
import { captureScreen } from "./screenshot.js";
import { mouseClick, mouseMove, mouseDrag } from "./mouse.js";
import { keyboardType, keyboardKey } from "./keyboard.js";
import { getAccessibilityTree, getMenuBar, clickMenuItem } from "./accessibility.js";
import { listApplications, activateApplication, listWindows } from "./applications.js";
export class MacOSAdapter {
    async captureScreen(displayId) {
        return captureScreen(displayId);
    }
    async mouseClick(options) {
        return mouseClick(options);
    }
    async mouseMove(options) {
        return mouseMove(options);
    }
    async mouseDrag(options) {
        return mouseDrag(options);
    }
    async keyboardType(options) {
        return keyboardType(options);
    }
    async keyboardKey(options) {
        return keyboardKey(options);
    }
    async listApplications() {
        return listApplications();
    }
    async activateApplication(bundleIdOrName) {
        return activateApplication(bundleIdOrName);
    }
    async listWindows() {
        return listWindows();
    }
    async getAccessibilityTree(pid, maxDepth) {
        return getAccessibilityTree(pid, maxDepth);
    }
    async getMenuBar(pid) {
        return getMenuBar(pid);
    }
    async clickMenuItem(pid, menuPath) {
        return clickMenuItem(pid, menuPath);
    }
}
//# sourceMappingURL=index.js.map