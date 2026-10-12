import { NextRequest } from 'next/server';
import { resolveRalionAuthContext } from '@/lib/auth/serverAuth';
import { corsJsonResponse } from '@/lib/cors';
import { AmdTokenFactoryService } from '@ralion/ai/server';

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

  try {
    if (action === 'usage') {
      const usage = await AmdTokenFactoryService.getUsage(auth.context.workspace.id);
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

  try {
    const body = await request.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages : [{ role: 'user', content: String(body.prompt || '') }];

    const result = await AmdTokenFactoryService.createChatCompletion({
      model: body.model,
      messages,
      temperature: body.temperature,
      max_tokens: body.max_tokens,
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
        error: 'CHAT_COMPLETION_ERROR',
        message: error.message || 'Failed to execute AMD Token Factory chat completion',
      },
      { status: 500 },
      request
    );
  }
}
