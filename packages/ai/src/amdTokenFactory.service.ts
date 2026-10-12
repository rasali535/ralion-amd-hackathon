/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * AMD Token Factory & Radeon Inference Service (Exclusively Server-Side)
 *
 * Implements the documented AMD Radeon / ROCm Developer API endpoints:
 * - GET  /models
 * - POST /chat/completions
 * - GET  /usage
 *
 * Uses RADEON_API_KEY strictly on the server side. Never exposed to browser bundles.
 * Test fixtures are explicitly labeled; no invented metrics or fake device outputs.
 */

import 'server-only';

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
  isFixture?: boolean;
  fixtureNotice?: string;
}

export interface AmdUsageResponse {
  object: 'usage';
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  workspace_id?: string;
  isFixture?: boolean;
  fixtureNotice?: string;
}

export class AmdTokenFactoryService {
  public static readonly DEFAULT_BASE_URL = 'https://developer.amd.com.cn/radeon/api/v1';

  private static getApiKey(): string | null {
    return process.env.RADEON_API_KEY || null;
  }

  private static getBaseUrl(): string {
    return process.env.AMD_TOKEN_FACTORY_URL || this.DEFAULT_BASE_URL;
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
            id: 'amd-rocm-llama-3-8b-instruct',
            object: 'model',
            owned_by: 'amd-radeon',
          },
          {
            id: 'amd-rocm-mixtral-8x7b-instruct',
            object: 'model',
            owned_by: 'amd-radeon',
          },
        ],
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; returning offline test catalog.',
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
    const model = request.model || 'amd-rocm-llama-3-8b-instruct';

    if (!apiKey) {
      const userPrompt = request.messages[request.messages.length - 1]?.content || '';
      return {
        id: `amd_chat_fixture_${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `[AMD ROCm Test Fixture] Response for prompt: "${userPrompt.slice(0, 100)}"`,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: Math.ceil(userPrompt.length / 4),
          completion_tokens: 15,
          total_tokens: Math.ceil(userPrompt.length / 4) + 15,
        },
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; returning explicit test fixture response.',
      };
    }

    const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens ?? 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`AMD Token Factory /chat/completions returned HTTP ${response.status}: ${await response.text().catch(() => '')}`);
    }

    return await response.json();
  }

  /**
   * Retrieves usage metrics from AMD Token Factory (GET /usage).
   */
  static async getUsage(workspaceId?: string): Promise<AmdUsageResponse> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        object: 'usage',
        total_tokens: 0,
        prompt_tokens: 0,
        completion_tokens: 0,
        workspace_id: workspaceId,
        isFixture: true,
        fixtureNotice: 'TEST_FIXTURE: No RADEON_API_KEY configured; zero usage telemetry fixture.',
      };
    }

    const query = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : '';
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
}
