import 'server-only';
import { getPrivilegedSupabase } from '@/lib/supabase/server';

/**
 * Centralized AMD demo quota. Postgres RPC is atomic across separate Vercel
 * instances. Fail closed if migration/service credentials are unavailable.
 * Charge attempts, not just successful completions, to prevent retry abuse.
 */
export async function reserveHackathonInference(userId: string): Promise<{
 allowed: boolean; remaining: number; globalRemaining: number; resetAt: string;
}> {
  const client = getPrivilegedSupabase();
  const { data, error } = await client.rpc('reserve_hackathon_inference', { p_user_id: userId });
  if (error) throw new Error('INFERENCE_BUDGET_UNAVAILABLE');
  const result = data as { allowed?: boolean; remaining?: number; globalRemaining?: number; resetAt?: string };
  if (!result || typeof result.allowed !== 'boolean') throw new Error('INFERENCE_BUDGET_UNAVAILABLE');
  return {
    allowed: result.allowed,
    remaining: Math.max(0, Number(result.remaining || 0)),
    globalRemaining: Math.max(0, Number(result.globalRemaining || 0)),
    resetAt: String(result.resetAt || ''),
  };
}
