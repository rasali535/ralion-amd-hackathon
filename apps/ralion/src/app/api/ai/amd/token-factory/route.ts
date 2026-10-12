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

  try {
    const quota = await AmdTokenFactoryService.getQuota(auth.context.workspace.id);
    return corsJsonResponse(
      {
        success: true,
        workspaceId: auth.context.workspace.id,
        quota,
      },
      { status: 200 },
      request
    );
  } catch (error: any) {
    return corsJsonResponse(
      {
        success: false,
        error: 'TOKEN_FACTORY_ERROR',
        message: error.message || 'Failed to retrieve Token Factory quota',
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
    const requestedTokens = Math.min(Math.max(Number(body.tokens) || 1000, 1), 100_000);

    const result = await AmdTokenFactoryService.mintTokens(
      auth.context.workspace.id,
      requestedTokens
    );

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
        error: 'TOKEN_MINT_ERROR',
        message: error.message || 'Failed to mint Token Factory tokens',
      },
      { status: 500 },
      request
    );
  }
}
