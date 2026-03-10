/**
 * Password-based authentication provider.
 *
 * Validates requests using the Authorization: Bearer <password> header.
 * Uses constant-time comparison to prevent timing attacks.
 */
import type { AuthProvider } from "./types.js";
export declare class PasswordAuthProvider implements AuthProvider {
    private readonly passwordBuffer;
    constructor(password: string);
    authenticate(req: {
        headers: Record<string, string | string[] | undefined>;
    }): Promise<boolean>;
}
//# sourceMappingURL=password.d.ts.map