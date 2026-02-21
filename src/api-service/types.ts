export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export type AuthType = 'api_key' | 'oauth' | 'basic' | 'none';

export interface ProviderConfig {
  name: string;
  endpoint: string;
  authType: AuthType;
  apiKey?: string;
  apiKeyHeader?: string;
  apiKeyPrefix?: string;
  oauthToken?: string;
  oauthHeader?: string;
  username?: string;
  password?: string;
  rateLimit?: number;
  rateWindowMs?: number;
  logLevel?: LogLevel;
  healthEndpoint?: string;
  timeoutMs?: number;
}

export interface ApiServiceConfig {
  port: number;
  basePath: string;
  logLevel: LogLevel;
  maxBodyBytes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}
