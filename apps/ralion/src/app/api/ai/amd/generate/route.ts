import { NextRequest } from 'next/server';
import { AmdInferenceService } from '@ralion/ai/server';
import { corsJsonResponse, handleCorsPreflight } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return corsJsonResponse({
        success: false,
        error: 'PROMPT_REQUIRED',
        message: 'A valid prompt string is required for AMD ROCm inference.',
      }, { status: 400 }, request);
    }

    const result = await AmdInferenceService.generate({
      prompt,
      systemPrompt: body?.systemPrompt,
      conversationHistory: body?.conversationHistory,
      model: body?.model,
      temperature: body?.temperature,
      maxTokens: body?.maxTokens,
    });

    return corsJsonResponse({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    }, undefined, request);
  } catch (error: any) {
    return corsJsonResponse({
      success: false,
      error: 'INFERENCE_FAILED',
      message: error.message || 'AMD ROCm inference failed.',
    }, { status: 500 }, request);
  }
}
