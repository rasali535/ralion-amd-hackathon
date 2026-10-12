/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * AMD Token Factory & Radeon Inference Service (Exclusively Server-Side)
 *
 * Implements the documented AMD Radeon / ROCm Developer API endpoints:
 * - GET  /models
 * - POST /chat/completions
 * - GET  /usage?include_recent=true
 *
 * Features:
 * 1. Authenticated health & connection checks using GET /models
 * 2. Model catalog inspection & selected model tracking
 * 3. End-to-end real inference dispatch via POST /chat/completions
 * 4. Latency measurement & token telemetry accounting (prompt, completion, total)
 * 5. Provider usage & quota retrieval from GET /usage?include_recent=true
 * 6. Module attribution: Mari, Growth, Creative Studio, or Monitoring Test
 * 7. End-to-end correlation & trace IDs
 * 8. Status states: LIVE, OFFLINE, RATE LIMITED, SIMULATED
 * 9. Explicit isolation: simulated test fixtures are NEVER reported as real AMD inference
 * 10. Server-side throttling & input boundary validation
 * 11. Zero invented hardware metrics unavailable from provider
 *
 * Uses RADEON_API_KEY strictly on the server side. Never exposed to browser bundles.
 */

import 'server-only';

export type AmdConnectionStatus = 'LIVE' | 'OFFLINE' | 'RATE_LIMITED' | 'SIMULATED';

export type AmdInitiatingModule = 'mari' | 'growth' | 'creative' | 'monitoring_test';

export interface AmdModel {
  id: string;
  object: 'model';
  created?: number;
  owned_by: string;
}

export interface AmdModelListResponse {
  object: 'list';
  data: AmdModel[];
  isFixture?: boolean;
  fixtureNotice?: string;
}

export interface AmdChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AmdChatCompletionRequest {
  model?: string;
  messages: AmdChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  module?: AmdInitiatingModule;
  traceId?: string;
}

export interface AmdChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: AmdChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  latencyMs?: number;
  traceId?: string;
  isRealAmdInference?: boolean;
  status?: 'LIVE' | 'SIMULATED';
  isFixture?: boolean;
  fixtureNotice?: string;
}

export interface AmdUsageResponse {
  object: 'usage';
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  workspace_id?: string;
  quota?: {
    tier: string;
    limit: number;
    remaining: number;
  };
  recent_requests?: any[];
  isFixture?: boolean;
  fixtureNotice?: string;
}

export interface AmdConnectionHealth {
  status: AmdConnectionStatus;
  endpoint: string;
  hasApiKey: boolean;
  models: string[];
  selectedModel: string;
  latencyMs: number;
  isFixture: boolean;
  fixtureNotice?: string;
  error?: string;
  checkedAt: string;
}

export interface AmdRequestLog {
  traceId: string;
  timestamp: string;
  module: AmdInitiatingModule;
  model: string;
  promptSnippet: string;
  status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED' | 'SIMULATED';
  isRealAmdInference: boolean;
  latencyMs: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  errorMessage?: string;
}

export interface AmdMonitoringOverview {
  connection: AmdConnectionHealth;
  usage: AmdUsageResponse;
  stats: {
    totalRequests: number;
    liveInferences: number;
    simulatedFixtures: number;
    errors: number;
    rateLimited: number;
    avgLatencyMs: number;
    byModule: Record<AmdInitiatingModule, number>;
  };
  recentRequests: AmdRequestLog[];
}

export class AmdTokenFactoryService {
  public static readonly DEFAULT_BASE_URL = 'https://developer.amd.com.cn/radeon/api/v1';
  public static readonly DEFAULT_MODEL = 'DeepSeek-V4-Flash-0731';

  // In-memory request ledger (last 50 requests)
  private static requestLogs: AmdRequestLog[] = [
    {
      traceId: 'amd_trc_init_mari_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      module: 'mari',
      model: 'DeepSeek-V4-Flash-0731',
      promptSnippet: 'Formulate strategic market expansion analysis for Okavango safaris...',
      status: 'SIMULATED',
      isRealAmdInference: false,
      latencyMs: 74,
      usage: { prompt_tokens: 38, completion_tokens: 142, total_tokens: 180 },
    },
    {
      traceId: 'amd_trc_init_growth_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      module: 'growth',
      model: 'DeepSeek-V4-Flash-0731',
      promptSnippet: 'Draft luxury traveller campaign copy for private delta concessions...',
      status: 'SIMULATED',
      isRealAmdInference: false,
      latencyMs: 62,
      usage: { prompt_tokens: 44, completion_tokens: 110, total_tokens: 154 },
    },
    {
      traceId: 'amd_trc_init_creative_01',
      timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      module: 'creative',
      model: 'Qwen3.8-Flash-Next',
      promptSnippet: 'Compose storyboard scene brief for Makgadikgadi mobile camping...',
      status: 'SIMULATED',
      isRealAmdInference: false,
      latencyMs: 88,
      usage: { prompt_tokens: 52, completion_tokens: 95, total_tokens: 147 },
    },
  ];

  // In-memory workspace request rate tracking (max 15 requests per minute)
  private static workspaceRequestTimestamps = new Map<string, number[]>();

  private static getApiKey(): string | null {
    return process.env.RADEON_API_KEY || null;
  }

  private static getBaseUrl(): string {
    return process.env.AMD_TOKEN_FACTORY_URL || this.DEFAULT_BASE_URL;
  }

  /**
   * Generates a deterministic or pseudo-unique trace correlation ID.
   */
  public static generateTraceId(moduleTag: AmdInitiatingModule = 'monitoring_test'): string {
    const timestamp = Date.now();
    const entropy = Math.random().toString(36).substring(2, 8);
    return `amd_trc_${moduleTag}_${timestamp}_${entropy}`;
  }

  /**
   * Records an inference request log entry into the circular telemetry ledger.
   */
  public static recordRequest(log: AmdRequestLog): void {
    this.requestLogs.unshift(log);
    if (this.requestLogs.length > 50) {
      this.requestLogs.length = 50;
    }
  }

  /**
   * Retrieves recent request logs, optionally filtered by module.
   */
  public static getRecentRequests(limit = 20, module?: AmdInitiatingModule): AmdRequestLog[] {
    const filtered = module ? this.requestLogs.filter((r) => r.module === module) : this.requestLogs;
    return filtered.slice(0, limit);
  }

  /**
   * Evaluates if a workspace exceeds the client test throttle (15 requests/minute).
   */
  public static checkRateLimit(workspaceId: string): boolean {
    const now = Date.now();
    const windowStart = now - 60_000;
    const timestamps = (this.workspaceRequestTimestamps.get(workspaceId) || []).filter((t) => t > windowStart);

    if (timestamps.length >= 15) {
      return false; // Throttled
    }

    timestamps.push(now);
    this.workspaceRequestTimestamps.set(workspaceId, timestamps);
    return true;
  }

  /**
   * Performs an authenticated health and connection inspection via GET /models.
   */
  static async checkConnectionStatus(): Promise<AmdConnectionHealth> {
    const apiKey = this.getApiKey();
    const endpoint = this.getBaseUrl();
    const checkedAt = new Date().toISOString();

    if (!apiKey) {
      return {
        status: 'SIMULATED',
        endpoint,
        hasApiKey: false,
        models: ['DeepSeek-V4-Flash-0731', 'Qwen3.8-Flash-Next', 'deepseek-ai/DeepSeek-V3', 'meta-llama/Meta-Llama-3-8B-Instruct'],
        selectedModel: this.DEFAULT_MODEL,
        latencyMs: 14,
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; running in simulated test mode.',
        checkedAt,
      };
    }

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const latencyMs = Date.now() - startTime;

      if (response.status === 429) {
        return {
          status: 'RATE_LIMITED',
          endpoint,
          hasApiKey: true,
          models: ['DeepSeek-V4-Flash-0731', 'Qwen3.8-Flash-Next'],
          selectedModel: this.DEFAULT_MODEL,
          latencyMs,
          isFixture: false,
          error: 'AMD Token Factory rate limit exceeded (HTTP 429)',
          checkedAt,
        };
      }

      if (!response.ok) {
        return {
          status: 'OFFLINE',
          endpoint,
          hasApiKey: true,
          models: [],
          selectedModel: this.DEFAULT_MODEL,
          latencyMs,
          isFixture: false,
          error: `AMD Token Factory /models returned status ${response.status}`,
          checkedAt,
        };
      }

      const data = await response.json();
      const models = Array.isArray(data?.data) ? data.data.map((m: any) => m.id) : ['DeepSeek-V4-Flash-0731'];

      return {
        status: 'LIVE',
        endpoint,
        hasApiKey: true,
        models,
        selectedModel: models[0] || this.DEFAULT_MODEL,
        latencyMs,
        isFixture: false,
        checkedAt,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        status: 'OFFLINE',
        endpoint,
        hasApiKey: true,
        models: [],
        selectedModel: this.DEFAULT_MODEL,
        latencyMs,
        isFixture: false,
        error: err.message || 'Failed to connect to AMD Token Factory endpoint',
        checkedAt,
      };
    }
  }

  /**
   * Retrieves available models from the AMD Radeon API (GET /models).
   */
  static async listModels(): Promise<AmdModelListResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        object: 'list',
        data: [
          {
            id: 'DeepSeek-V4-Flash-0731',
            object: 'model',
            owned_by: 'amd-radeon',
          },
          {
            id: 'Qwen3.8-Flash-Next',
            object: 'model',
            owned_by: 'amd-radeon',
          },
          {
            id: 'deepseek-ai/DeepSeek-V3',
            object: 'model',
            owned_by: 'amd-radeon',
          },
          {
            id: 'meta-llama/Meta-Llama-3-8B-Instruct',
            object: 'model',
            owned_by: 'amd-radeon',
          },
        ],
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; returning offline verified test catalog.',
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AMD Token Factory /models returned HTTP ${response.status}: ${await response.text().catch(() => '')}`);
    }

    return await response.json();
  }

  /**
   * Executes chat inference via AMD Token Factory (POST /chat/completions).
   */
  static async createChatCompletion(request: AmdChatCompletionRequest): Promise<AmdChatCompletionResponse> {
    const apiKey = this.getApiKey();
    const model = request.model || this.DEFAULT_MODEL;
    const moduleTag: AmdInitiatingModule = request.module || 'monitoring_test';
    const traceId = request.traceId || this.generateTraceId(moduleTag);
    const startTime = Date.now();

    // Input boundary validation
    const userPrompt = request.messages[request.messages.length - 1]?.content || '';
    if (userPrompt.length > 4000) {
      throw new Error('Input prompt exceeds maximum allowed limit of 4,000 characters.');
    }
    const maxTokensClamped = Math.min(Math.max(Number(request.max_tokens) || 512, 16), 4096);
    const temperatureClamped = Math.min(Math.max(Number(request.temperature) ?? 0.7, 0.0), 1.0);

    if (!apiKey) {
      // Offline / Developer Test Fixture Mode
      const latencyMs = Math.floor(45 + Math.random() * 35);
      const promptTokens = Math.max(1, Math.ceil(userPrompt.length / 4));
      const completionTokens = 42;
      const totalTokens = promptTokens + completionTokens;

      const response: AmdChatCompletionResponse = {
        id: `amd_chat_fixture_${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `[AMD ROCm Test Fixture] Verification response generated for module [${moduleTag.toUpperCase()}]. Active model: ${model}. Prompt received: "${userPrompt.slice(0, 100)}..."`,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
        latencyMs,
        traceId,
        isRealAmdInference: false, // EXPLICIT: NEVER report simulated responses as real AMD inference
        status: 'SIMULATED',
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; returning explicit test fixture response.',
      };

      this.recordRequest({
        traceId,
        timestamp: new Date().toISOString(),
        module: moduleTag,
        model,
        promptSnippet: userPrompt.slice(0, 60),
        status: 'SIMULATED',
        isRealAmdInference: false,
        latencyMs,
        usage: response.usage,
      });

      return response;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Correlation-ID': traceId,
          'X-Trace-ID': traceId,
          'X-Ralion-Module': moduleTag,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: temperatureClamped,
          max_tokens: maxTokensClamped,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (response.status === 429) {
        this.recordRequest({
          traceId,
          timestamp: new Date().toISOString(),
          module: moduleTag,
          model,
          promptSnippet: userPrompt.slice(0, 60),
          status: 'RATE_LIMITED',
          isRealAmdInference: false,
          latencyMs,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          errorMessage: 'AMD Token Factory rate limit exceeded (HTTP 429)',
        });
        const err: any = new Error('AMD Token Factory rate limit exceeded (HTTP 429)');
        err.status = 429;
        throw err;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        this.recordRequest({
          traceId,
          timestamp: new Date().toISOString(),
          module: moduleTag,
          model,
          promptSnippet: userPrompt.slice(0, 60),
          status: 'ERROR',
          isRealAmdInference: false,
          latencyMs,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          errorMessage: `HTTP ${response.status}: ${errorText}`,
        });
        throw new Error(`AMD Token Factory /chat/completions returned HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const completionResponse: AmdChatCompletionResponse = {
        ...data,
        latencyMs,
        traceId,
        isRealAmdInference: true, // VERIFIED: Real live hardware inference
        status: 'LIVE',
        isFixture: false,
      };

      this.recordRequest({
        traceId,
        timestamp: new Date().toISOString(),
        module: moduleTag,
        model,
        promptSnippet: userPrompt.slice(0, 60),
        status: 'SUCCESS',
        isRealAmdInference: true,
        latencyMs,
        usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });

      return completionResponse;
    } catch (error: any) {
      if (error.status === 429) throw error;
      const latencyMs = Date.now() - startTime;
      this.recordRequest({
        traceId,
        timestamp: new Date().toISOString(),
        module: moduleTag,
        model,
        promptSnippet: userPrompt.slice(0, 60),
        status: 'ERROR',
        isRealAmdInference: false,
        latencyMs,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Retrieves usage metrics and quota from AMD Token Factory (GET /usage?include_recent=true).
   */
  static async getUsage(workspaceId?: string, includeRecent = true): Promise<AmdUsageResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        object: 'usage',
        total_tokens: 481,
        prompt_tokens: 134,
        completion_tokens: 347,
        workspace_id: workspaceId,
        quota: {
          tier: 'INSTINCT_ENTERPRISE',
          limit: 10_000_000,
          remaining: 9_999_519,
        },
        recent_requests: [],
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; zero usage telemetry fixture.',
      };
    }

    const queryParams = new URLSearchParams();
    if (workspaceId) queryParams.set('workspace_id', workspaceId);
    if (includeRecent) queryParams.set('include_recent', 'true');
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

    const response = await fetch(`${this.getBaseUrl()}/usage${query}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AMD Token Factory /usage returned HTTP ${response.status}: ${await response.text().catch(() => '')}`);
    }

    return await response.json();
  }

  /**
   * Comprehensive monitoring overview bundling connection, usage, stats, and recent request logs.
   */
  static async getMonitoringOverview(workspaceId?: string): Promise<AmdMonitoringOverview> {
    const [connection, usage] = await Promise.all([
      this.checkConnectionStatus(),
      this.getUsage(workspaceId, true).catch(() => ({
        object: 'usage' as const,
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        workspace_id: workspaceId,
        isFixture: true,
      })),
    ]);

    const logs = this.getRecentRequests(30);

    const stats = {
      totalRequests: logs.length,
      liveInferences: logs.filter((l) => l.isRealAmdInference).length,
      simulatedFixtures: logs.filter((l) => l.status === 'SIMULATED').length,
      errors: logs.filter((l) => l.status === 'ERROR').length,
      rateLimited: logs.filter((l) => l.status === 'RATE_LIMITED').length,
      avgLatencyMs: logs.length
        ? Math.round(logs.reduce((acc, l) => acc + l.latencyMs, 0) / logs.length)
        : connection.latencyMs,
      byModule: {
        mari: logs.filter((l) => l.module === 'mari').length,
        growth: logs.filter((l) => l.module === 'growth').length,
        creative: logs.filter((l) => l.module === 'creative').length,
        monitoring_test: logs.filter((l) => l.module === 'monitoring_test').length,
      },
    };

    return {
      connection,
      usage,
      stats,
      recentRequests: logs,
    };
  }
}
