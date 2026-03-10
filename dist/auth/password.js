/**
 * Password-based authentication provider.
 *
 * Validates requests using the Authorization: Bearer <password> header.
 * Uses constant-time comparison to prevent timing attacks.
 */
import { timingSafeEqual } from "node:crypto";
export class PasswordAuthProvider {
    passwordBuffer;
    constructor(password) {
        if (!password) {
            throw new Error("Password must not be empty");
        }
        this.passwordBuffer = Buffer.from(password, "utf-8");
    }
    async authenticate(req) {
        const authHeader = req.headers["authorization"];
        if (!authHeader || typeof authHeader !== "string") {
            return false;
        }
        const prefix = "Bearer ";
        if (!authHeader.startsWith(prefix)) {
            return false;
        }
        const token = authHeader.slice(prefix.length);
        if (!token) {
            return false;
        }
        const tokenBuffer = Buffer.from(token, "utf-8");
        // timingSafeEqual requires equal-length buffers.
        // If lengths differ, the password is wrong — but we still do a
        // constant-time comparison against the expected password to avoid
        // leaking length information through timing.
        if (tokenBuffer.length !== this.passwordBuffer.length) {
            // Compare against itself to burn the same amount of time
            timingSafeEqual(this.passwordBuffer, this.passwordBuffer);
            return false;
        }
        return timingSafeEqual(tokenBuffer, this.passwordBuffer);
    }
}
//# sourceMappingURL=password.js.map