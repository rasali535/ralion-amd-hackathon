import { reserveHackathonInference } from '@/lib/amd/hackathonQuota';
import { NextRequest } from 'next/server';
import { resolveRalionAuthContext } from '@/lib/auth/serverAuth';
import { corsJsonResponse, handleCorsPreflight } from '@/lib/cors';
import { AmdTokenFactoryService, AmdInitiatingModule, AdaptiveModelRouter } from '@ralion/ai/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

/**
 * GET /api/ai/amd/monitoring
 * Returns full AMD AI Monitoring Centre telemetry:
 * - Connection status from authenticated GET /models
 * - Available models and selected default
 * - Usage and quota details from GET /usage?include_recent=true
 * - Recent request logs with module identification, trace IDs, latency, and status
 * - Optional zero-token routing decision preview via ?action=routing-decision
 */
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
  const action = searchParams.get('action');

  if (action === 'routing-decision' || action === 'routing-preview') {
    const prompt = searchParams.get('prompt') || '';
    const moduleTag = (searchParams.get('module') as any) || 'monitoring_test';
    const preferredModel = searchParams.get('preferredModel') || undefined;

    const decision = await AdaptiveModelRouter.decideRoute({
      prompt,
      module: moduleTag,
      workspaceId: auth.context.workspace.id,
      preferredModel: preferredModel && preferredModel !== 'auto' ? preferredModel : undefined,
    });

    return corsJsonResponse({ success: true, workspaceId: auth.context.workspace.id, decision }, { status: 200 }, request);
  }

  try {
    const overview = await AmdTokenFactoryService.getMonitoringOverview(auth.context.workspace.id);

    return corsJsonResponse(
      {
        success: true,
        workspaceId: auth.context.workspace.id,
        organizationId: auth.context.organization.id,
        ...overview,
      },
      { status: 200 },
      request
    );
  } catch (error: any) {
    // Keep secrets out of HTTP responses; write a bounded server-side category.
    console.error('[AMDMonitoring] Provider overview failed', {
      name: String(error?.name || 'Error').slice(0, 80),
      code: String(error?.code || 'UNKNOWN').slice(0, 80),
      status: Number(error?.status || 0),
    });
    return corsJsonResponse(
      {
        success: false,
        error: 'MONITORING_TELEMETRY_ERROR',
        message: error.message || 'Failed to retrieve AMD AI Monitoring Centre telemetry',
      },
      { status: 500 },
      request
    );
  }
}

/**
 * POST /api/ai/amd/monitoring
 * Executes the "Run AMD Test" action:
 * - Sends inference request to POST /chat/completions
 * - Measures end-to-end latency
 * - Returns provider token usage
 * - Correlates with traceId
 * - Tagged by module (default: 'monitoring_test')
 * - Explicitly differentiates between LIVE AMD inference vs SIMULATED test fixture
 */
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
        message: 'Too many AMD test requests. Please wait a moment before running additional inference tests.',
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

    const moduleTag: AmdInitiatingModule = ['mari', 'growth', 'creative', 'monitoring_test'].includes(body?.module)
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

    const requestedModel = body?.model && body.model !== 'auto' ? body.model : undefined;
    const routingDecision = await AdaptiveModelRouter.decideRoute({
      prompt: messages[messages.length - 1]?.content || '',
      module: moduleTag,
      workspaceId: auth.context.workspace.id,
      preferredModel: requestedModel,
    });

    const result = await AmdTokenFactoryService.createChatCompletion({
      model: routingDecision.selectedModel,
      messages,
      temperature: body?.temperature,
      max_tokens: body?.max_tokens,
      module: moduleTag,
      traceId: body?.traceId,
      workspaceId: auth.context.workspace.id,
    });

    const assistantChoice = result.choices?.[0]?.message?.content || '';

    return corsJsonResponse(
      {
        success: true,
        workspaceId: auth.context.workspace.id,
        traceId: result.traceId,
        latencyMs: result.latencyMs,
        model: result.model,
        module: moduleTag,
        response: assistantChoice,
        usage: result.usage,
        status: result.status,
        isRealAmdInference: result.isRealAmdInference ?? false,
        isFixture: result.isFixture ?? false,
        fixtureNotice: result.fixtureNotice,
        finishReason: result.choices?.[0]?.finish_reason || 'stop',
        routingDecision,
        timestamp: new Date().toISOString(),
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
        error: isRateLimit ? 'RATE_LIMITED' : (isBadRequest ? 'BAD_REQUEST' : 'AMD_INFERENCE_ERROR'),
        message: error.message || 'Failed to dispatch inference request to AMD Token Factory',
      },
      { status: isRateLimit ? 429 : (isBadRequest ? 400 : 500) },
      request
    );
  }
}
