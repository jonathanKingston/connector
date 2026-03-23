/**
 * Optional verbose logging for MCP HTTP traffic and platform calls.
 * Enable with CONNECTOR_DEBUG=1 or CONNECTOR_DEBUG=true (stderr, prefix [connector]).
 *
 * CONNECTOR_DEBUG_SSE (default on): set to 0 or false to skip capturing/logging SSE
 * response bodies for POST. GET /mcp SSE streams are not logged when SSE is off (avoids
 * empty omitted-SSE noise). Still logs non-SSE responses (e.g. 400 JSON).
 *
 * CONNECTOR_TRUST_PROXY: set to 1, true, yes, or a hop count so req.ip reflects the client
 * when the connector sits behind a reverse proxy (used for clientIp in debug logs).
 */

import { inspect } from "node:util";
import type { Request, Response as ExpressResponse } from "express";

const ENABLED =
  process.env.CONNECTOR_DEBUG === "1" ||
  process.env.CONNECTOR_DEBUG?.toLowerCase() === "true";

/** When false, SSE bodies are not parsed or summarized (GET and POST event-stream). */
const SSE_BODIES_ENABLED =
  process.env.CONNECTOR_DEBUG_SSE !== "0" &&
  process.env.CONNECTOR_DEBUG_SSE?.toLowerCase() !== "false";

const MAX_ARG_JSON_CHARS = 4_000;
/** Raw bytes buffered from the response body for logging (SSE can be large). */
const MAX_POST_RESPONSE_CAPTURE = 512 * 1024;
const MAX_GET_RESPONSE_CAPTURE = 32 * 1024;

export function connectorDebugEnabled(): boolean {
  return ENABLED;
}

export function connectorDebugSseBodiesEnabled(): boolean {
  return SSE_BODIES_ENABLED;
}

/** Client IP for debug logs; uses req.ip when trust proxy is configured. */
export function clientIp(req: Request): string {
  const ip = req.ip;
  if (typeof ip === "string" && ip.length > 0) return ip;
  const addr = req.socket?.remoteAddress;
  if (typeof addr === "string" && addr.length > 0) return addr;
  return "(unknown)";
}

function clientIpField(ip: string | undefined): { clientIp: string } | Record<string, never> {
  return ip ? { clientIp: ip } : {};
}

/**
 * Approximate bytes written for this HTTP response on the underlying socket (headers + body).
 * Useful when the MCP stack streams via Web APIs so res.write() is not always used.
 * Meaningful for sequential HTTP/1.1 responses on a connection; less so for HTTP/2 multiplexing.
 */
function approxWireBytesForResponse(
  res: ExpressResponse,
  wireStart: number | undefined,
): number | undefined {
  const sock = res.socket;
  const end =
    sock && typeof sock.bytesWritten === "number" ? sock.bytesWritten : undefined;
  if (wireStart === undefined || typeof end !== "number") return undefined;
  return end - wireStart;
}

/** Format a debug argument: JSON.stringify for plain data (full nesting), inspect fallback. */
function formatConnectorDebugArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean") return String(arg);
  if (arg === undefined) return "undefined";
  if (arg === null) return "null";
  try {
    return JSON.stringify(arg, null, 2);
  } catch {
    return inspect(arg, {
      depth: null,
      colors: false,
      maxArrayLength: 100,
      maxStringLength: 2000,
    });
  }
}

export function connectorDebug(...args: unknown[]): void {
  if (!ENABLED) return;
  console.error(`[connector]\n${args.map(formatConnectorDebugArg).join("\n")}`);
}

function summarizeForDebug(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  try {
    const s = JSON.stringify(value);
    if (s.length <= MAX_ARG_JSON_CHARS) {
      return JSON.parse(s) as unknown;
    }
    return {
      _truncated: true,
      preview: `${s.slice(0, MAX_ARG_JSON_CHARS)}…`,
      totalChars: s.length,
    };
  } catch {
    return "[unserializable]";
  }
}

/**
 * Log JSON-RPC messages carried by POST /mcp (batch or single).
 */
export function logMcpPostBody(
  body: unknown,
  sessionId: string | undefined,
  ip?: string,
): void {
  if (!ENABLED) return;

  const batch = Array.isArray(body) ? body : [body];
  const sid = sessionId ?? "(new)";
  const ipField = clientIpField(ip);

  for (const msg of batch) {
    if (!msg || typeof msg !== "object") {
      connectorDebug("mcp POST", { sessionId: sid, message: msg, ...ipField });
      continue;
    }

    const o = msg as Record<string, unknown>;
    const method = o.method;
    const id = o.id;

    if (method === "tools/call") {
      const params = o.params as
        | { name?: string; arguments?: unknown }
        | undefined;
      connectorDebug("mcp POST tools/call", {
        sessionId: sid,
        id,
        name: params?.name,
        arguments:
          params?.arguments !== undefined
            ? summarizeForDebug(params.arguments)
            : undefined,
        ...ipField,
      });
    } else if (typeof method === "string") {
      connectorDebug("mcp POST", { sessionId: sid, id, method, ...ipField });
    } else {
      connectorDebug("mcp POST", { sessionId: sid, id, raw: o, ...ipField });
    }
  }
}

/**
 * Parse SSE `data:` lines and return summarized JSON-RPC payloads (truncated).
 */
function summarizeSseDataPayloads(sseBody: string): unknown[] {
  const out: unknown[] = [];
  for (const block of sseBody.split(/\n\n+/)) {
    const lines = block.split("\n");
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice("data:".length).trimStart();
      if (!payload) continue;
      try {
        out.push(summarizeForDebug(JSON.parse(payload) as unknown));
      } catch {
        out.push(
          payload.length > 200 ? `${payload.slice(0, 200)}…` : payload,
        );
      }
    }
  }
  return out;
}

export type McpResponseDebugRoute = "POST" | "GET" | "DELETE";

export type McpResponseDebugContext = {
  sessionId: string | undefined;
  route: McpResponseDebugRoute;
  /** Client IP when CONNECTOR_TRUST_PROXY is set correctly behind a proxy. */
  clientIp?: string;
};

/**
 * Log only approximate wire bytes for a response (no body capture). Use for GET /mcp when
 * CONNECTOR_DEBUG_SSE=0 so high-churn SSE does not allocate buffers or parse events.
 * Skips logging for successful SSE streams (noisy empty lines when body capture is off).
 */
export function attachMcpWireBytesOnly(
  res: ExpressResponse,
  context: McpResponseDebugContext,
): void {
  if (!ENABLED) return;

  const sid = context.sessionId ?? "(new)";
  const wireStart =
    res.socket && typeof res.socket.bytesWritten === "number"
      ? res.socket.bytesWritten
      : undefined;
  const ipField = clientIpField(context.clientIp);

  res.on("finish", () => {
    const rawCt = res.getHeader("content-type");
    const contentType =
      typeof rawCt === "string" ? rawCt : Array.isArray(rawCt) ? rawCt.join(", ") : "";
    const isSse = contentType.includes("text/event-stream");
    if (!SSE_BODIES_ENABLED && context.route === "GET" && isSse) {
      return;
    }
    connectorDebug("mcp response", {
      route: context.route,
      sessionId: sid,
      statusCode: res.statusCode,
      contentType: contentType || undefined,
      ...(isSse ? { sseBody: "omitted" as const } : {}),
      approxWireBytes: approxWireBytesForResponse(res, wireStart),
      ...ipField,
    });
  });
}

/**
 * When CONNECTOR_DEBUG is on, log the outbound HTTP body after the response is sent.
 * POST MCP replies are usually SSE with JSON-RPC in `data:` lines; GET may be a long-lived SSE stream.
 */
export function attachMcpResponseDebugLogging(
  res: ExpressResponse,
  context: McpResponseDebugContext,
): void {
  if (!ENABLED) return;

  const sid = context.sessionId ?? "(new)";
  const ipField = clientIpField(context.clientIp);
  const wireStart =
    res.socket && typeof res.socket.bytesWritten === "number"
      ? res.socket.bytesWritten
      : undefined;
  const maxCapture =
    context.route === "GET" ? MAX_GET_RESPONSE_CAPTURE : MAX_POST_RESPONSE_CAPTURE;

  const chunks: Buffer[] = [];
  let bufferedBytes = 0;
  let totalBytes = 0;
  let capture = true;
  let contentType = "";
  let logged = false;

  function noteContentType(value: string): void {
    contentType = value;
  }

  function addChunk(chunk: unknown, encoding?: BufferEncoding): void {
    if (chunk === undefined || chunk === null) return;
    let buf: Buffer;
    if (Buffer.isBuffer(chunk)) {
      buf = chunk;
    } else if (typeof chunk === "string") {
      buf = Buffer.from(chunk, encoding ?? "utf8");
    } else if (chunk instanceof Uint8Array) {
      buf = Buffer.from(chunk);
    } else {
      buf = Buffer.from(String(chunk));
    }
    totalBytes += buf.length;
    if (!capture) return;
    const room = maxCapture - bufferedBytes;
    if (room <= 0) {
      capture = false;
      return;
    }
    if (buf.length <= room) {
      chunks.push(buf);
      bufferedBytes += buf.length;
    } else {
      chunks.push(buf.subarray(0, room));
      bufferedBytes += room;
      capture = false;
    }
  }

  function flushLog(): void {
    if (logged) return;
    logged = true;

    const statusCode = res.statusCode;
    const raw = Buffer.concat(chunks).toString("utf8");
    const isSse = contentType.includes("text/event-stream");
    const truncated = totalBytes > bufferedBytes;
    const approxWireBytes = approxWireBytesForResponse(res, wireStart);

    if (isSse && !SSE_BODIES_ENABLED) {
      connectorDebug("mcp response", {
        route: context.route,
        sessionId: sid,
        statusCode,
        contentType,
        sseBody: "omitted",
        capturedBytes: bufferedBytes,
        totalBytes,
        approxWireBytes,
        ...ipField,
      });
      return;
    }

    if (isSse) {
      const events = summarizeSseDataPayloads(raw);
      connectorDebug("mcp response", {
        route: context.route,
        sessionId: sid,
        statusCode,
        contentType,
        capturedBytes: bufferedBytes,
        totalBytes,
        truncated,
        approxWireBytes,
        sseEvents: events.length ? events : undefined,
        sseRawPreview:
          events.length === 0 && raw
            ? raw.length > 500
              ? `${raw.slice(0, 500)}…`
              : raw
            : undefined,
        ...ipField,
      });
      return;
    }

    if (!raw) {
      connectorDebug("mcp response", {
        route: context.route,
        sessionId: sid,
        statusCode,
        contentType,
        body: null,
        approxWireBytes,
        ...ipField,
      });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      connectorDebug("mcp response", {
        route: context.route,
        sessionId: sid,
        statusCode,
        contentType,
        body: summarizeForDebug(parsed),
        approxWireBytes,
        ...ipField,
      });
    } catch {
      connectorDebug("mcp response", {
        route: context.route,
        sessionId: sid,
        statusCode,
        contentType,
        bodyPreview:
          raw.length > MAX_ARG_JSON_CHARS
            ? `${raw.slice(0, MAX_ARG_JSON_CHARS)}…`
            : raw,
        approxWireBytes,
        ...ipField,
      });
    }
  }

  // Patch low-level write path (used by Hono Node adapter for MCP transport).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Express overloads vs monkey-patch
  const r = res as any;
  const origSetHeader = r.setHeader.bind(r);
  r.setHeader = (name: string, value: number | string | readonly string[]) => {
    if (name.toLowerCase() === "content-type") {
      noteContentType(String(value));
    }
    return origSetHeader(name, value);
  };

  const origWriteHead = r.writeHead.bind(r);
  r.writeHead = (code: number, ...args: unknown[]) => {
    for (const arg of args) {
      if (arg && typeof arg === "object" && !Array.isArray(arg)) {
        const h = arg as Record<string, unknown>;
        const ct = h["content-type"] ?? h["Content-Type"];
        if (typeof ct === "string") noteContentType(ct);
      }
    }
    return origWriteHead(code, ...args);
  };

  const origWrite = r.write.bind(r);
  r.write = (chunk: unknown, encoding?: unknown, cb?: unknown) => {
    if (typeof encoding === "function") {
      addChunk(chunk);
      return origWrite(chunk, encoding);
    }
    addChunk(chunk, encoding as BufferEncoding | undefined);
    return origWrite(chunk, encoding, cb);
  };

  const origEnd = r.end.bind(r);
  r.end = (chunk?: unknown, encoding?: unknown, cb?: unknown) => {
    if (typeof chunk === "function") {
      flushLog();
      return origEnd(chunk);
    }
    if (typeof encoding === "function") {
      addChunk(chunk);
      flushLog();
      return origEnd(chunk, encoding);
    }
    addChunk(chunk, encoding as BufferEncoding | undefined);
    flushLog();
    return origEnd(chunk, encoding, cb);
  };

  res.on("finish", () => {
    if (!logged) flushLog();
  });
}
