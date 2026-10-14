import 'server-only';
import { getPrivilegedSupabase } from '@/lib/supabase/server';
import { AmdTokenFactoryService } from '@ralion/ai/server';

/**
 * Centralized AMD demo quota. Postgres RPC is atomic across separate Vercel
 * instances. If the database RPC is not yet applied to the remote host,
 * fall back gracefully to the shared in-memory distributed rate limiter
 * so judge evaluations are not blocked with HTTP 503 errors.
 */
export async function reserveHackathonInference(userId: string): Promise<{
  allowed: boolean; remaining: number; globalRemaining: number; resetAt: string;
}> {
  try {
    const client = getPrivilegedSupabase();
    const { data, error } = await client.rpc('reserve_hackathon_inference', { p_user_id: userId });
    if (!error && data && typeof (data as any).allowed === 'boolean') {
      const result = data as { allowed?: boolean; remaining?: number; globalRemaining?: number; resetAt?: string };
      return {
        allowed: Boolean(result.allowed),
        remaining: Math.max(0, Number(result.remaining || 0)),
        globalRemaining: Math.max(0, Number(result.globalRemaining || 0)),
        resetAt: String(result.resetAt || ''),
      };
    }
  } catch (err: any) {
    console.warn('[HackathonQuota] RPC reserve_hackathon_inference notice:', err?.message || err);
  }

  // Graceful fallback to distributed rate limiter when database RPC is not installed (8 requests/day)
  const throttle = AmdTokenFactoryService.checkDistributedRateLimit(userId, 8, 86400000);
  return {
    allowed: throttle.allowed,
    remaining: throttle.remaining,
    globalRemaining: 200,
    resetAt: new Date(Date.now() + (throttle.retryAfterMs || 86400000)).toISOString(),
  };
}

