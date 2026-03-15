# 50 Codebase Improvement Ideas

## Testing & Quality

1. **Add integration tests** — Test the full HTTP request lifecycle (auth → MCP → tool → response) using supertest against the Express server.
2. **Add config validation tests** — Test edge cases for config loading (missing env vars, invalid port, empty password).
3. **Add session lifecycle tests** — Test session creation, reuse, cleanup, and concurrent session handling.
4. **Add error path tests for exec helper** — Test timeout behavior, signal killing, and stderr parsing in `helpers/exec.ts`.
5. **Add snapshot tests for JXA scripts** — Ensure the generated osascript commands don't silently change.
6. **Measure and enforce code coverage** — Add `vitest --coverage` with a minimum threshold (e.g., 80%).
7. **Add property-based testing** — Use fast-check to fuzz tool inputs (coordinates, key names, text strings).

## CI/CD & DevOps

8. **Add GitHub Actions CI pipeline** — Run lint, build, and tests on every PR.
9. **Add Dockerfile** — Containerize the server for consistent deployment environments.
10. **Add pre-commit hooks** — Use husky + lint-staged to run lint/format before commits.
11. **Add semantic versioning** — Use conventional commits and automated changelog generation.
12. **Add dependabot config** — Automatically keep dependencies up to date.

## Code Quality & Linting

13. **Add ESLint with strict rules** — Enforce consistent code style beyond what TypeScript checks.
14. **Add Prettier** — Enforce consistent formatting across all files.
15. **Add strict return type annotations** — Enforce explicit return types on all exported functions.
16. **Add import sorting** — Use eslint-plugin-import or Prettier plugin for consistent import order.

## Security

17. **Add rate limiting** — Protect against brute-force password attempts and DoS with express-rate-limit.
18. **Add HTTPS support** — Allow configuring TLS certificates for encrypted connections without SSH tunnels.
19. **Add request body size limits** — Prevent memory exhaustion from oversized payloads.
20. **Add session expiry** — Auto-clean stale sessions after a configurable timeout.
21. **Add CORS configuration** — Allow configuring allowed origins for browser-based MCP clients.
22. **Add audit logging** — Log all tool invocations with timestamps, session IDs, and tool names for security review.

## Architecture & Extensibility

23. **Add Linux platform adapter** — Implement xdotool/xdg-based automation for Linux desktops.
24. **Add Windows platform adapter** — Implement PowerShell/Win32 API automation for Windows.
25. **Add plugin system for custom tools** — Allow users to register additional MCP tools without modifying core code.
26. **Add middleware pipeline for tools** — Allow pre/post processing hooks (logging, validation, rate limiting) on tool calls.
27. **Add event streaming** — Support server-sent events for real-time screen change notifications.

## Performance

28. **Add screenshot caching** — Cache recent screenshots with configurable TTL to reduce screencapture calls.
29. **Add connection pooling for osascript** — Reuse JXA processes instead of spawning new ones per call.
30. **Add response compression** — Enable gzip/brotli compression for base64 screenshot payloads.
31. **Add screenshot region capture** — Allow capturing a specific rect instead of full screen to reduce payload size.
32. **Add parallel tool execution** — Support batch tool calls that execute concurrently.
33. **Add image format options** — Support JPEG/WebP in addition to PNG for smaller screenshot payloads.

## Developer Experience

34. **Add hot reload for development** — Use tsx or ts-node-dev instead of `tsc --watch` + manual restart.
35. **Add OpenAPI/Swagger docs** — Auto-generate API documentation from the Express routes.
36. **Add a health check endpoint** — `GET /health` returning server status, uptime, and active session count.
37. **Add structured logging** — Replace console.log/error with a structured logger (pino or winston) with log levels.
38. **Add environment validation on startup** — Validate all required env vars and fail fast with helpful messages.
39. **Add .env file support** — Load configuration from `.env` files using dotenv for easier local development.
40. **Add CLI flags** — Support `--port`, `--host`, `--password` as CLI arguments in addition to env vars.

## Reliability & Robustness

41. **Add graceful session drain on shutdown** — Wait for in-flight requests to complete before closing.
42. **Add retry logic for flaky osascript calls** — Retry transient failures (e.g., accessibility not ready) with backoff.
43. **Add input sanitization for osascript** — Escape special characters in text passed to JXA to prevent injection.
44. **Add timeout configuration per tool** — Allow different timeouts for screenshot (fast) vs accessibility tree (slow).
45. **Add memory leak detection** — Monitor session map growth and warn when too many sessions accumulate.

## Features

46. **Add clipboard read/write tools** — Allow AI agents to interact with the system clipboard.
47. **Add file system tools** — Basic file read/write/list for the remote machine.
48. **Add screen recording tool** — Short video capture for observing animations or transitions.
49. **Add multi-monitor support in accessibility** — Include display ID in accessibility tree results.
50. **Add OCR tool** — Extract text from screen regions when accessibility tree is unavailable.
