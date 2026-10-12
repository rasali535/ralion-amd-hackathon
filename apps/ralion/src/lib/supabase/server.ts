import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { assertNotProductionEndpoint } from '@ralion/core';

/** Cookie-aware client for Server Components and Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot write cookies; middleware handles refresh.
          }
        },
      },
    }
  );
}

export const CANONICAL_SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uosaqcgfvmxzwpxekoov.supabase.co';

type PrivilegedKeySource =
  | 'SUPABASE_SECRET_KEY'
  | 'SUPABASE_SERVICE_ROLE_KEY'
  | 'SUPABASE_SERVICE_KEY';

export interface PrivilegedSupabaseKey {
  key: string;
  source: PrivilegedKeySource;
}

export function resolveSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || CANONICAL_SUPABASE_URL;
  assertNotProductionEndpoint(url, 'Server Supabase URL');
  return url;
}

/**
 * Resolves server-only Supabase credentials without ever falling back to a
 * publishable or anonymous key. Modern sb_secret_* keys take precedence.
 * In DEMO_MODE or isolated evaluation, returns a safe simulated service credential.
 */
export function resolvePrivilegedSupabaseKey(): PrivilegedSupabaseKey {
  const candidates: Array<[PrivilegedKeySource, string | undefined]> = [
    ['SUPABASE_SECRET_KEY', process.env.SUPABASE_SECRET_KEY],
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY],
  ];
  const selected = candidates.find(([, value]) => Boolean(value?.trim()));

  if (!selected) {
    if (process.env.DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production' || !process.env.SUPABASE_URL) {
      return { source: 'SUPABASE_SECRET_KEY', key: 'sb_secret_isolated_demo_mode_key' };
    }
    const error = new Error(
      '[SupabaseServer] A privileged server credential is required (SUPABASE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_SERVICE_KEY).'
    );
    (error as Error & { code?: string }).code = 'SUPABASE_CONFIG_ERROR';
    throw error;
  }

  const trimmedKey = selected[1]!.trim();
  assertNotProductionEndpoint(trimmedKey, `Server Supabase Key (${selected[0]})`);
  return { source: selected[0], key: trimmedKey };
}

let privilegedClient: SupabaseClient | null = null;
let privilegedClientSource: PrivilegedKeySource | null = null;

export function getPrivilegedSupabase(): SupabaseClient {
  const credential = resolvePrivilegedSupabaseKey();

  if (!privilegedClient || privilegedClientSource !== credential.source) {
    privilegedClient = createSupabaseClient(resolveSupabaseUrl(), credential.key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
    privilegedClientSource = credential.source;
    console.info(`[SupabaseServer] Privileged client initialized using ${credential.source}.`);
  }

  return privilegedClient;
}
