import { reserveHackathonInference } from '@/lib/amd/hackathonQuota';
import { NextRequest } from 'next/server';
import { resolveRalionAuthContext } from '@/lib/auth/serverAuth';
import { corsJsonResponse } from '@/lib/cors';
import { AmdTokenFactoryService, AmdInitiatingModule } from '@ralion/ai/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await resolveRalionAuthContext(request);
  if (auth.status !== 'CONTEXT_RESOLVED' || !auth.context) {
    return corsJsonResponse(
      { success: false, error: auth.errorCode || 'UNAUTHORIZED', message: auth.errorMessage || 'Authentication required' },
      { status: auth.httpStatus },
      request
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'models';
  const includeRecent = searchParams.get('include_recent') === 'true';

  try {
    if (action === 'readiness') {
      // A read-only provider connection probe. A configured API key or cached
      // fixture is not evidence of successful real inference.
      const overview = await AmdTokenFactoryService.getMonitoringOverview(auth.context.workspace.id);
      const connection = overview.connection;
      const liveConnection = connection?.status === 'LIVE' && connection?.isFixture === false;
      return corsJsonResponse({
        success: true,
        workspaceId: auth.context.workspace.id,
        amd: {
          status: connection?.status || 'OFFLINE',
          providerReachable: liveConnection,
          isFixture: Boolean(connection?.isFixture),
          model: connection?.selectedModel || null,
          checkedAt: connection?.checkedAt || new Date().toISOString(),
          latencyMs: connection?.latencyMs ?? null,
        },
        inferenceVerified: false,
        nextStep: 'Run AMD Monitoring POST and confirm isRealAmdInference=true with traceId and token usage.',
      }, { status: 200, headers: { 'Cache-Control': 'no-store' } }, request);
    }

    if (action === 'monitoring' || action === 'status') {
      const overview = await AmdTokenFactoryService.getMonitoringOverview(auth.context.workspace.id);
      return corsJsonResponse(
        {
          success: true,
          workspaceId: auth.context.workspace.id,
          ...overview,
        },
        { status: 200 },
        request
      );
    }

    if (action === 'usage') {
      const usage = await AmdTokenFactoryService.getUsage(auth.context.workspace.id, includeRecent);
      return corsJsonResponse(
        {
          success: true,
          workspaceId: auth.context.workspace.id,
          ...usage,
        },
        { status: 200 },
        request
      );
    }

    const models = await AmdTokenFactoryService.listModels();
    return corsJsonResponse(
      {
        success: true,
        workspaceId: auth.context.workspace.id,
        ...models,
      },
      { status: 200 },
      request
    );
  } catch (error: any) {
    return corsJsonResponse(
      {
        success: false,
        error: 'TOKEN_FACTORY_ERROR',
        message: error.message || 'Failed to retrieve AMD Token Factory data',
      },
      { status: 500 },
      request
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await resolveRalionAuthContext(request);
  if (auth.status !== 'CONTEXT_RESOLVED' || !auth.context) {
    return corsJsonResponse(
      { success: false, error: auth.errorCode || 'UNAUTHORIZED', message: auth.errorMessage || 'Authentication required' },
      { status: auth.httpStatus },
      request
    );
  }

  // Distributed rate limiting / throttling: max 15 requests per minute per workspace
  const throttle = AmdTokenFactoryService.checkDistributedRateLimit(auth.context.workspace.id);
  if (!throttle.allowed) {
    return corsJsonResponse(
      {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many AMD test requests. Please wait before submitting additional inference jobs.',
        retryAfterMs: throttle.retryAfterMs,
      },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil(throttle.retryAfterMs / 1000).toString() },
      },
      request
    );
  }

  try {
    const body = await request.json().catch(() => ({}));

    // Comprehensive validation of client-supplied messages or fallback prompt
    let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    const allowedRoles = ['system', 'user', 'assistant'] as const;

    if (body?.messages !== undefined) {
      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return corsJsonResponse(
          {
            success: false,
            error: 'INVALID_MESSAGES_PAYLOAD',
            message: 'Client-supplied messages must be a non-empty array.',
          },
          { status: 400 },
          request
        );
      }

      if (body.messages.length > 50) {
        return corsJsonResponse(
          {
            success: false,
            error: 'MAX_MESSAGES_EXCEEDED',
            message: 'Messages array exceeds maximum limit of 50 turns.',
          },
          { status: 400 },
          request
        );
      }

      let totalChars = 0;
      for (let i = 0; i < body.messages.length; i++) {
        const msg = body.messages[i];
        if (!msg || typeof msg !== 'object') {
          return corsJsonResponse(
            {
              success: false,
              error: 'INVALID_MESSAGE_FORMAT',
              message: `Message at index ${i} must be an object with role and content.`,
            },
            { status: 400 },
            request
          );
        }

        if (!allowedRoles.includes(msg.role)) {
          return corsJsonResponse(
            {
              success: false,
              error: 'INVALID_ROLE',
              message: `Invalid role '${msg.role}' at index ${i}. Allowed roles: system, user, assistant.`,
            },
            { status: 400 },
            request
          );
        }

        if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
          return corsJsonResponse(
            {
              success: false,
              error: 'EMPTY_CONTENT',
              message: `Message content at index ${i} must be a non-empty string.`,
            },
            { status: 400 },
            request
          );
        }

        if (msg.content.length > 4000) {
          return corsJsonResponse(
            {
              success: false,
              error: 'CONTENT_LENGTH_EXCEEDED',
              message: `Message content at index ${i} exceeds maximum limit of 4,000 characters.`,
            },
            { status: 400 },
            request
          );
        }

        totalChars += msg.content.length;
      }

      if (totalChars > 16000) {
        return corsJsonResponse(
          {
            success: false,
            error: 'PAYLOAD_TOO_LARGE',
            message: `Total messages payload size (${totalChars} chars) exceeds maximum allowable limit of 16,000 characters.`,
          },
          { status: 400 },
          request
        );
      }

      messages = body.messages.map((m: any) => ({ role: m.role, content: m.content.trim() }));
    } else {
      const rawPrompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
      if (!rawPrompt) {
        return corsJsonResponse(
          {
            success: false,
            error: 'PROMPT_REQUIRED',
            message: 'A non-empty prompt or valid messages array is required to run AMD inference.',
          },
          { status: 400 },
          request
        );
      }

      if (rawPrompt.length > 4000) {
        return corsJsonResponse(
          {
            success: false,
            error: 'CONTENT_LENGTH_EXCEEDED',
            message: 'Prompt exceeds maximum limit of 4,000 characters.',
          },
          { status: 400 },
          request
        );
      }

      messages = [{ role: 'user', content: rawPrompt }];
    }

    if (body?.model) {
      const isAvailable = await AmdTokenFactoryService.isModelAvailable(body.model);
      if (!isAvailable) {
        const availableModels = await AmdTokenFactoryService.getAvailableModels();
        return corsJsonResponse(
          {
            success: false,
            error: 'MODEL_NOT_FOUND',
            message: `Model '${body.model}' is unavailable in current AMD catalog. Available verified AMD models: ${availableModels.join(', ')}`,
          },
          { status: 400 },
          request
        );
      }
    }

    const moduleTag: AmdInitiatingModule = ['mari', 'growth', 'creative', 'monitoring_test'].includes(body.module)
      ? body.module
      : 'monitoring_test';

    // The central quota is applied immediately before the real provider call.
    // Never trust client-side counters or a per-instance Map for Vercel billing protection.
    let budget;
    try {
      budget = await reserveHackathonInference(auth.context.user.id);
    } catch {
      return corsJsonResponse(
        { success: false, error: 'INFERENCE_BUDGET_UNAVAILABLE', message: 'Demo AI is temporarily unavailable. Please try again later.' },
        { status: 503 },
        request
      );
    }
    if (!budget.allowed) {
      return corsJsonResponse(
        { success: false, error: 'DAILY_AI_LIMIT_REACHED', message: 'This demo has reached its daily AI allowance. You can still explore the campaign walkthrough.', remaining: budget.remaining, resetAt: budget.resetAt },
        { status: 429, headers: { 'Retry-After': '3600' } },
        request
      );
    }

    const result = await AmdTokenFactoryService.createChatCompletion({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      module: moduleTag,
      traceId: body.traceId,
      workspaceId: auth.context.workspace.id,
    });

    return corsJsonResponse(
      {
        workspaceId: auth.context.workspace.id,
        ...result,
      },
      { status: 200 },
      request
    );
  } catch (error: any) {
    const isRateLimit = error.status === 429 || error.message?.includes('429');
    const isBadRequest = error.status === 400 ||
      error.code === 'INVALID_MESSAGES' ||
      error.message?.includes('messages') ||
      error.message?.includes('Available verified AMD models');
    return corsJsonResponse(
      {
        success: false,
        error: isRateLimit ? 'RATE_LIMITED' : (isBadRequest ? 'BAD_REQUEST' : 'CHAT_COMPLETION_ERROR'),
        message: error.message || 'Failed to execute AMD Token Factory chat completion',
      },
      { status: isRateLimit ? 429 : (isBadRequest ? 400 : 500) },
      request
    );
  }
}
