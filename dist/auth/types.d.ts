/**
 * Authentication provider interface.
 *
 * Currently implemented with password-based auth (Bearer token).
 * Designed to be swappable — a future token-based provider would implement
 * the same interface without any changes to the server or tool code.
 */
export interface AuthProvider {
    /**
     * Validate an incoming request.
     * @returns true if authenticated, false otherwise.
     */
    authenticate(req: {
        headers: Record<string, string | string[] | undefined>;
    }): Promise<boolean>;
}
//# sourceMappingURL=types.d.ts.map