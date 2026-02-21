import http from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  buildAuthHeaders,
  createApiService,
  loadProvidersFromEnv,
} from "../server";

const startMockProvider = () =>
  new Promise<{ server: http.Server; url: string }>((resolve) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      if (url.pathname === "/health") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (url.pathname === "/echo") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              method: req.method,
              body: Buffer.concat(chunks).toString("utf8"),
            }),
          );
        });
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ server, url: `http://localhost:${port}` });
    });
  });

describe("API service provider configuration", () => {
  it("loads providers from env for all auth types", () => {
    const env: NodeJS.ProcessEnv = {
      API_PROVIDER_OPENAI_ENDPOINT: "https://example.com",
      API_PROVIDER_OPENAI_AUTH_TYPE: "api_key",
      API_PROVIDER_OPENAI_API_KEY: "secret",
      API_PROVIDER_BASIC_ENDPOINT: "https://basic.example.com",
      API_PROVIDER_BASIC_AUTH_TYPE: "basic",
      API_PROVIDER_BASIC_USERNAME: "user",
      API_PROVIDER_BASIC_PASSWORD: "pass",
      API_PROVIDER_OAUTH_ENDPOINT: "https://oauth.example.com",
      API_PROVIDER_OAUTH_AUTH_TYPE: "oauth",
      API_PROVIDER_OAUTH_OAUTH_TOKEN: "token",
    };

    const providers = loadProvidersFromEnv(env);
    const names = providers.map((p) => p.name);
    expect(names).toContain("openai");
    expect(names).toContain("basic");
    expect(names).toContain("oauth");
  });

  it("builds auth headers for api_key, oauth, and basic", () => {
    const apiKeyHeaders = buildAuthHeaders({
      name: "openai",
      endpoint: "https://example.com",
      authType: "api_key",
      apiKey: "secret",
      apiKeyHeader: "x-api-key",
      apiKeyPrefix: "",
    });
    expect(apiKeyHeaders["x-api-key"]).toBe("secret");

    const oauthHeaders = buildAuthHeaders({
      name: "oauth",
      endpoint: "https://example.com",
      authType: "oauth",
      oauthToken: "token",
    });
    expect(oauthHeaders.Authorization).toBe("Bearer token");

    const basicHeaders = buildAuthHeaders({
      name: "basic",
      endpoint: "https://example.com",
      authType: "basic",
      username: "user",
      password: "pass",
    });
    expect(basicHeaders.Authorization).toContain("Basic ");
  });
});

describe("API service endpoints", () => {
  let providerServer: http.Server;
  let apiServer: ReturnType<typeof createApiService>;
  let apiUrl = "";

  beforeAll(async () => {
    const mock = await startMockProvider();
    providerServer = mock.server;
    const env: NodeJS.ProcessEnv = {
      API_PROVIDER_TEST_ENDPOINT: mock.url,
      API_PROVIDER_TEST_AUTH_TYPE: "api_key",
      API_PROVIDER_TEST_API_KEY: "secret",
      API_PROVIDER_TEST_API_KEY_HEADER: "x-api-key",
      API_PROVIDER_TEST_API_KEY_PREFIX: "",
      API_PROVIDER_TEST_RATE_LIMIT: "10",
      API_PROVIDER_TEST_RATE_WINDOW_MS: "60000",
      API_PROVIDER_TEST_HEALTH_ENDPOINT: `${mock.url}/health`,
    };

    apiServer = createApiService({ port: 0, basePath: "/v1" }, { env });
    const started = await apiServer.start();
    apiUrl = `http://localhost:${started.port}`;
  });

  afterAll(async () => {
    await apiServer.stop();
    await new Promise<void>((resolve) => providerServer.close(() => resolve()));
  });

  it("returns provider health status", async () => {
    const response = await fetch(`${apiUrl}/v1/providers/test/health`);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("applies rate limiting per provider", async () => {
    const mock = await startMockProvider();
    const env: NodeJS.ProcessEnv = {
      API_PROVIDER_LIMITED_ENDPOINT: mock.url,
      API_PROVIDER_LIMITED_AUTH_TYPE: "api_key",
      API_PROVIDER_LIMITED_API_KEY: "secret",
      API_PROVIDER_LIMITED_API_KEY_HEADER: "x-api-key",
      API_PROVIDER_LIMITED_API_KEY_PREFIX: "",
      API_PROVIDER_LIMITED_RATE_LIMIT: "1",
      API_PROVIDER_LIMITED_RATE_WINDOW_MS: "60000",
      API_PROVIDER_LIMITED_HEALTH_ENDPOINT: `${mock.url}/health`,
    };

    const limitedService = createApiService(
      { port: 0, basePath: "/v1" },
      { env },
    );
    const started = await limitedService.start();
    const limitedUrl = `http://localhost:${started.port}`;

    const response = await fetch(`${limitedUrl}/v1/providers/limited/health`);
    const rateLimited = await fetch(
      `${limitedUrl}/v1/providers/limited/health`,
    );
    expect(response.status).toBe(200);
    expect(rateLimited.status).toBe(429);

    await limitedService.stop();
    await new Promise<void>((resolve) => mock.server.close(() => resolve()));
  });

  it("proxies provider requests", async () => {
    const response = await fetch(`${apiUrl}/v1/providers/test/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "POST",
        path: "/echo",
        body: { hello: "world" },
      }),
    });
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
