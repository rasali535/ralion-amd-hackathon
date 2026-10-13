import { NextRequest } from 'next/server';
import { AmdInferenceService } from '@ralion/ai/server';
import { corsJsonResponse, handleCorsPreflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest) {
  try {
    const health = await AmdInferenceService.checkHealth();
    return corsJsonResponse({
      success: true,
      ...health,
      timestamp: new Date().toISOString(),
    }, undefined, request);
  } catch (error: any) {
    return corsJsonResponse({
      success: false,
      status: 'offline',
      error: error.message || 'Failed to inspect AMD ROCm status',
    }, { status: 500 }, request);
  }
}
