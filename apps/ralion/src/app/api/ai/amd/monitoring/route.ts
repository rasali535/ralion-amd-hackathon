import { NextRequest } from 'next/server';
import { resolveRalionAuthContext } from '@/lib/auth/serverAuth';
import { corsJsonResponse, handleCorsPreflight } from '@/lib/cors';
import { AmdTokenFactoryService, AmdInitiatingModule } from '@ralion/ai/server';

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

  // Rate limiting / throttling: max 15 requests per minute per workspace
  if (!AmdTokenFactoryService.checkRateLimit(auth.context.workspace.id)) {
    return corsJsonResponse(
      {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many AMD test requests. Please wait a moment before running additional inference tests.',
      },
      { status: 429 },
      request
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawPrompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!rawPrompt) {
      return corsJsonResponse(
        {
          success: false,
          error: 'PROMPT_REQUIRED',
          message: 'A non-empty prompt is required to run AMD inference.',
        },
        { status: 400 },
        request
      );
    }

    if (rawPrompt.length > 4000) {
      return corsJsonResponse(
        {
          success: false,
          error: 'PROMPT_TOO_LONG',
          message: 'Prompt exceeds the maximum allowed length of 4,000 characters.',
        },
        { status: 400 },
        request
      );
    }

    const messages = Array.isArray(body?.messages) && body.messages.length > 0
      ? body.messages
      : [{ role: 'user' as const, content: rawPrompt }];

    const moduleTag: AmdInitiatingModule = ['mari', 'growth', 'creative', 'monitoring_test'].includes(body?.module)
      ? body.module
      : 'monitoring_test';

    const result = await AmdTokenFactoryService.createChatCompletion({
      model: body?.model,
      messages,
      temperature: body?.temperature,
      max_tokens: body?.max_tokens,
      module: moduleTag,
      traceId: body?.traceId,
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
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
      request
    );
  } catch (error: any) {
    const isRateLimit = error.status === 429 || error.message?.includes('429');
    return corsJsonResponse(
      {
        success: false,
        error: isRateLimit ? 'RATE_LIMITED' : 'AMD_INFERENCE_ERROR',
        message: error.message || 'Failed to dispatch inference request to AMD Token Factory',
      },
      { status: isRateLimit ? 429 : 500 },
      request
    );
  }
}
