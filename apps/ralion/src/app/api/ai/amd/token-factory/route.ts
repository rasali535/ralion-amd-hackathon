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

  // Rate limiting / throttling: max 15 requests per minute per workspace
  if (!AmdTokenFactoryService.checkRateLimit(auth.context.workspace.id)) {
    return corsJsonResponse(
      {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many AMD test requests. Please wait before submitting additional inference jobs.',
      },
      { status: 429 },
      request
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawPrompt = String(body.prompt || '');
    if (rawPrompt.length > 4000) {
      return corsJsonResponse(
        {
          success: false,
          error: 'INPUT_TOO_LARGE',
          message: 'Prompt exceeds maximum allowed boundary of 4,000 characters.',
        },
        { status: 400 },
        request
      );
    }

    const messages = Array.isArray(body.messages) && body.messages.length > 0
      ? body.messages
      : [{ role: 'user', content: rawPrompt || 'Strategic AMD ROCm infrastructure validation prompt.' }];

    const moduleTag: AmdInitiatingModule = ['mari', 'growth', 'creative', 'monitoring_test'].includes(body.module)
      ? body.module
      : 'monitoring_test';

    const result = await AmdTokenFactoryService.createChatCompletion({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
      module: moduleTag,
      traceId: body.traceId,
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
    return corsJsonResponse(
      {
        success: false,
        error: error.status === 429 ? 'RATE_LIMITED' : 'CHAT_COMPLETION_ERROR',
        message: error.message || 'Failed to execute AMD Token Factory chat completion',
      },
      { status: error.status === 429 ? 429 : 500 },
      request
    );
  }
}
