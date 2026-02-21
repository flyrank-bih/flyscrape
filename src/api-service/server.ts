import { randomUUID } from "node:crypto";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";
import type {
  ApiResponse,
  ApiServiceConfig,
  AuthType,
  LogLevel,
  ProviderConfig,
} from "./types";

export type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const DEFAULT_BASE_PATH = "/v1";
const DEFAULT_PORT = 3000;
const DEFAULT_LOG_LEVEL: LogLevel = "info";
const DEFAULT_MAX_BODY_BYTES = 1024 * 1024;
const DEFAULT_RATE_WINDOW_MS = 60_000;
const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_TIMEOUT_MS = 20_000;

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

type Logger = {
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
};

class RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();

  allow(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const current = this.windows.get(key);
    if (!current || now >= current.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
    }
    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: current.resetAt,
      };
    }
    current.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, limit - current.count),
      resetAt: current.resetAt,
    };
  }
}

function createLogger(level: LogLevel): Logger {
  const threshold = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  return {
    error: (...args) => {
      if (threshold >= LOG_LEVELS.error) console.error(...args);
    },
    warn: (...args) => {
      if (threshold >= LOG_LEVELS.warn) console.warn(...args);
    },
    info: (...args) => {
      if (threshold >= LOG_LEVELS.info) console.info(...args);
    },
    debug: (...args) => {
      if (threshold >= LOG_LEVELS.debug) console.debug(...args);
    },
  };
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseLogLevel(
  value: string | undefined,
  fallback: LogLevel,
): LogLevel {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (
    normalized === "error" ||
    normalized === "warn" ||
    normalized === "info" ||
    normalized === "debug"
  ) {
    return normalized;
  }
  return fallback;
}

function normalizeProviderName(value: string): string {
  return value.trim().toLowerCase();
}

function buildAuthHeaders(provider: ProviderConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  if (provider.authType === "api_key") {
    if (!provider.apiKey) {
      throw new Error(`Missing API key for provider ${provider.name}`);
    }
    const header = provider.apiKeyHeader || "Authorization";
    const prefix = provider.apiKeyPrefix ?? "Bearer";
    headers[header] = prefix ? `${prefix} ${provider.apiKey}` : provider.apiKey;
  }
  if (provider.authType === "oauth") {
    if (!provider.oauthToken) {
      throw new Error(`Missing OAuth token for provider ${provider.name}`);
    }
    const header = provider.oauthHeader || "Authorization";
    headers[header] = `Bearer ${provider.oauthToken}`;
  }
  if (provider.authType === "basic") {
    if (!provider.username || !provider.password) {
      throw new Error(`Missing basic auth credentials for ${provider.name}`);
    }
    const token = Buffer.from(
      `${provider.username}:${provider.password}`,
      "utf8",
    ).toString("base64");
    headers.Authorization = `Basic ${token}`;
  }
  return headers;
}

function parseAuthType(value: string | undefined): AuthType {
  const normalized = value?.toLowerCase();
  if (
    normalized === "api_key" ||
    normalized === "oauth" ||
    normalized === "basic" ||
    normalized === "none"
  ) {
    return normalized;
  }
  return "none";
}

function getProviderEnv(
  env: NodeJS.ProcessEnv,
  name: string,
  key: string,
): string | undefined {
  const envKey = `API_PROVIDER_${name}_${key}`;
  return env[envKey];
}

export function loadProvidersFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ProviderConfig[] {
  const providers: ProviderConfig[] = [];
  const errors: string[] = [];
  const endpointRegex = /^API_PROVIDER_(.+)_ENDPOINT$/;

  for (const [key, value] of Object.entries(env)) {
    const match = key.match(endpointRegex);
    if (!match || !value) continue;
    const rawName = match[1];
    const name = normalizeProviderName(rawName);
    const rawAuthType = getProviderEnv(env, rawName, "AUTH_TYPE");
    const authType = parseAuthType(rawAuthType);
    const endpoint = value;
    if (!rawAuthType) {
      errors.push(`Missing AUTH_TYPE for ${rawName}`);
    } else if (authType === "none" && rawAuthType.toLowerCase() !== "none") {
      errors.push(`Invalid AUTH_TYPE for ${rawName}`);
    }
    const config: ProviderConfig = {
      name,
      endpoint,
      authType,
      apiKey: getProviderEnv(env, rawName, "API_KEY"),
      apiKeyHeader: getProviderEnv(env, rawName, "API_KEY_HEADER"),
      apiKeyPrefix: getProviderEnv(env, rawName, "API_KEY_PREFIX"),
      oauthToken: getProviderEnv(env, rawName, "OAUTH_TOKEN"),
      oauthHeader: getProviderEnv(env, rawName, "OAUTH_HEADER"),
      username: getProviderEnv(env, rawName, "USERNAME"),
      password: getProviderEnv(env, rawName, "PASSWORD"),
      rateLimit: parseNumber(
        getProviderEnv(env, rawName, "RATE_LIMIT"),
        DEFAULT_RATE_LIMIT,
      ),
      rateWindowMs: parseNumber(
        getProviderEnv(env, rawName, "RATE_WINDOW_MS"),
        DEFAULT_RATE_WINDOW_MS,
      ),
      logLevel: parseLogLevel(
        getProviderEnv(env, rawName, "LOG_LEVEL"),
        DEFAULT_LOG_LEVEL,
      ),
      healthEndpoint: getProviderEnv(env, rawName, "HEALTH_ENDPOINT"),
      timeoutMs: parseNumber(
        getProviderEnv(env, rawName, "TIMEOUT_MS"),
        DEFAULT_TIMEOUT_MS,
      ),
    };
    try {
      new URL(config.endpoint);
    } catch {
      errors.push(`Invalid ENDPOINT for ${rawName}`);
    }
    providers.push(config);
  }

  if (providers.length === 0) {
    errors.push("No providers configured via API_PROVIDER_<NAME>_ENDPOINT");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return providers;
}

function sendJson<T>(
  res: ServerResponse,
  status: number,
  payload: ApiResponse<T>,
) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(body));
  res.end(body);
}

function readJsonBody(req: IncomingMessage, maxBodyBytes: number) {
  return new Promise<unknown>((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve(undefined);
        return;
      }
      const text = Buffer.concat(chunks).toString("utf8");
      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", (error) => reject(error));
  });
}

function toJsonError(
  requestId: string,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return {
    success: false,
    requestId,
    error: {
      code,
      message,
      details,
    },
  };
}

function toJsonSuccess<T>(requestId: string, data: T) {
  return { success: true, requestId, data };
}

async function proxyProviderRequest(
  provider: ProviderConfig,
  payload: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean>;
    body?: unknown;
    timeoutMs?: number;
  },
  fetcher: FetchLike,
  logger: Logger,
) {
  const baseUrl = new URL(provider.endpoint);
  const path = payload.path ?? "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    throw new Error("Absolute URLs are not allowed in provider requests");
  }
  const targetUrl = new URL(path.replace(/^\//, ""), baseUrl);

  if (payload.query) {
    for (const [key, value] of Object.entries(payload.query)) {
      targetUrl.searchParams.set(key, String(value));
    }
  }

  const authHeaders = buildAuthHeaders(provider);
  const headers: Record<string, string> = {
    ...authHeaders,
    ...payload.headers,
  };

  let body: string | undefined;
  if (payload.body !== undefined) {
    if (typeof payload.body === "string") {
      body = payload.body;
    } else {
      body = JSON.stringify(payload.body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  const controller = new AbortController();
  const timeout = payload.timeoutMs ?? provider.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    logger.debug("Provider request", {
      provider: provider.name,
      url: targetUrl.toString(),
      method: payload.method ?? "POST",
    });
    const response = await fetcher(targetUrl, {
      method: payload.method ?? "POST",
      headers,
      body,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    let responseBody: unknown = text;
    if (contentType.includes("application/json")) {
      try {
        responseBody = JSON.parse(text);
      } catch {
        responseBody = text;
      }
    }
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export function createApiService(
  config: Partial<ApiServiceConfig> = {},
  options: {
    env?: NodeJS.ProcessEnv;
    fetcher?: FetchLike;
  } = {},
) {
  const env = options.env ?? process.env;
  const providers = loadProvidersFromEnv(env);
  const basePath =
    config.basePath ?? env.API_SERVICE_BASE_PATH ?? DEFAULT_BASE_PATH;
  const port =
    config.port ??
    parseNumber(env.PORT, parseNumber(env.API_SERVICE_PORT, DEFAULT_PORT));
  const logLevel =
    config.logLevel ??
    parseLogLevel(env.API_SERVICE_LOG_LEVEL, DEFAULT_LOG_LEVEL);
  const maxBodyBytes =
    config.maxBodyBytes ??
    parseNumber(env.API_SERVICE_MAX_BODY_BYTES, DEFAULT_MAX_BODY_BYTES);
  const serviceConfig: ApiServiceConfig = {
    port,
    basePath,
    logLevel,
    maxBodyBytes,
  };

  const fetcher = options.fetcher ?? fetch;
  const serviceLogger = createLogger(serviceConfig.logLevel);
  const limiter = new RateLimiter();
  const providerMap = new Map<string, ProviderConfig>(
    providers.map((p) => [p.name, p]),
  );

  const server = http.createServer(async (req, res) => {
    const requestId = randomUUID();
    res.setHeader("x-request-id", requestId);
    const method = req.method || "GET";
    const url = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    );
    const path = url.pathname;
    const startTime = Date.now();

    const logMeta = {
      method,
      path,
      requestId,
    };

    serviceLogger.info("Request received", logMeta);

    try {
      if (method === "GET" && path === "/health") {
        sendJson(
          res,
          200,
          toJsonSuccess(requestId, {
            status: "ok",
            providers: providers.map((p) => p.name),
          }),
        );
        return;
      }

      if (method === "GET" && path === `${serviceConfig.basePath}/providers`) {
        sendJson(
          res,
          200,
          toJsonSuccess(
            requestId,
            providers.map((p) => ({
              name: p.name,
              endpoint: p.endpoint,
              authType: p.authType,
              rateLimit: p.rateLimit,
              rateWindowMs: p.rateWindowMs,
              logLevel: p.logLevel,
            })),
          ),
        );
        return;
      }

      const providerMatch = path.match(
        new RegExp(`^${serviceConfig.basePath}/providers/([^/]+)(/.*)?$`),
      );
      if (providerMatch) {
        const providerName = normalizeProviderName(providerMatch[1]);
        const provider = providerMap.get(providerName);
        if (!provider) {
          sendJson(
            res,
            404,
            toJsonError(requestId, "PROVIDER_NOT_FOUND", "Provider not found", {
              provider: providerName,
            }),
          );
          return;
        }

        const providerLogger = createLogger(provider.logLevel ?? logLevel);
        const rateResult = limiter.allow(
          providerName,
          provider.rateLimit ?? DEFAULT_RATE_LIMIT,
          provider.rateWindowMs ?? DEFAULT_RATE_WINDOW_MS,
        );

        if (!rateResult.allowed) {
          res.setHeader(
            "Retry-After",
            Math.ceil((rateResult.resetAt - Date.now()) / 1000),
          );
          sendJson(
            res,
            429,
            toJsonError(
              requestId,
              "RATE_LIMIT_EXCEEDED",
              "Rate limit exceeded",
              {
                provider: providerName,
                resetAt: rateResult.resetAt,
              },
            ),
          );
          return;
        }

        const suffix = providerMatch[2] || "";

        if (method === "GET" && suffix === "") {
          sendJson(
            res,
            200,
            toJsonSuccess(requestId, {
              name: provider.name,
              endpoint: provider.endpoint,
              authType: provider.authType,
              rateLimit: provider.rateLimit,
              rateWindowMs: provider.rateWindowMs,
              logLevel: provider.logLevel,
              healthEndpoint: provider.healthEndpoint,
            }),
          );
          return;
        }

        if (method === "GET" && suffix === "/health") {
          const healthTarget = provider.healthEndpoint ?? provider.endpoint;
          let healthResult: {
            status: number;
            headers: Record<string, string>;
            body: unknown;
          };
          try {
            healthResult = await proxyProviderRequest(
              { ...provider, endpoint: healthTarget },
              { method: "GET" },
              fetcher,
              providerLogger,
            );
          } catch (error) {
            sendJson(
              res,
              502,
              toJsonError(
                requestId,
                "PROVIDER_HEALTH_FAILED",
                error instanceof Error ? error.message : "Health check failed",
                {
                  provider: provider.name,
                },
              ),
            );
            return;
          }

          if (healthResult.status >= 200 && healthResult.status < 400) {
            sendJson(
              res,
              200,
              toJsonSuccess(requestId, {
                provider: provider.name,
                status: healthResult.status,
                body: healthResult.body,
              }),
            );
            return;
          }

          sendJson(
            res,
            502,
            toJsonError(
              requestId,
              "PROVIDER_HEALTH_FAILED",
              "Provider health check failed",
              {
                provider: provider.name,
                status: healthResult.status,
                body: healthResult.body,
              },
            ),
          );
          return;
        }

        if (method === "POST" && suffix === "/request") {
          let payload: unknown;
          try {
            payload = await readJsonBody(req, serviceConfig.maxBodyBytes);
          } catch (error) {
            sendJson(
              res,
              400,
              toJsonError(
                requestId,
                "INVALID_JSON",
                error instanceof Error ? error.message : "Invalid JSON",
              ),
            );
            return;
          }

          if (!payload || typeof payload !== "object") {
            sendJson(
              res,
              400,
              toJsonError(
                requestId,
                "INVALID_PAYLOAD",
                "Request body must be a JSON object",
              ),
            );
            return;
          }

          let result: {
            status: number;
            headers: Record<string, string>;
            body: unknown;
          };
          try {
            result = await proxyProviderRequest(
              provider,
              payload as {
                method?: string;
                path?: string;
                headers?: Record<string, string>;
                query?: Record<string, string | number | boolean>;
                body?: unknown;
                timeoutMs?: number;
              },
              fetcher,
              providerLogger,
            );
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Provider request failed";
            const isPathError = message.includes("Absolute URLs");
            sendJson(
              res,
              isPathError ? 400 : 502,
              toJsonError(
                requestId,
                isPathError ? "INVALID_PATH" : "PROVIDER_REQUEST_FAILED",
                message,
                {
                  provider: provider.name,
                },
              ),
            );
            return;
          }

          if (result.status >= 400) {
            sendJson(
              res,
              result.status,
              toJsonError(
                requestId,
                "PROVIDER_ERROR",
                "Provider responded with an error",
                {
                  provider: provider.name,
                  status: result.status,
                  headers: result.headers,
                  body: result.body,
                },
              ),
            );
            return;
          }

          sendJson(
            res,
            200,
            toJsonSuccess(requestId, {
              provider: provider.name,
              status: result.status,
              headers: result.headers,
              body: result.body,
            }),
          );
          return;
        }
      }

      sendJson(
        res,
        404,
        toJsonError(requestId, "NOT_FOUND", "Route not found", {
          path,
        }),
      );
    } catch (error) {
      sendJson(
        res,
        500,
        toJsonError(
          requestId,
          "INTERNAL_ERROR",
          error instanceof Error ? error.message : "Internal error",
        ),
      );
    } finally {
      const durationMs = Date.now() - startTime;
      serviceLogger.info("Request completed", {
        ...logMeta,
        status: res.statusCode,
        durationMs,
      });
    }
  });

  return {
    server,
    config: serviceConfig,
    providers,
    start: () =>
      new Promise<{ port: number }>((resolve) => {
        server.listen(serviceConfig.port, () => {
          const address = server.address();
          if (address && typeof address === "object") {
            resolve({ port: address.port });
            return;
          }
          resolve({ port: serviceConfig.port });
        });
      }),
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
  };
}

export { buildAuthHeaders };
