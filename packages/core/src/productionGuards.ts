/**
 * Ralion OS — AMD Developer Hackathon ACT III
 * Production Isolation Guardrails & Environment Assertion
 *
 * Strictly prevents the hackathon codebase from ever connecting to the
 * original alinew production database, project ref, or backend domains.
 */

export const FORBIDDEN_PRODUCTION_PROJECT_REFS: readonly string[] = Object.freeze([
  'yidsfihagwttlmhfynmf',
]);

export const FORBIDDEN_PRODUCTION_DOMAINS: readonly string[] = Object.freeze([
  'yidsfihagwttlmhfynmf.supabase.co',
  'rasalilabs.com',
  'api.rasalilabs.com',
]);

export class FatalIsolationViolationError extends Error {
  public readonly code = 'FATAL_ISOLATION_VIOLATION';
  constructor(message: string) {
    super(message);
    this.name = 'FatalIsolationViolationError';
  }
}

/**
 * Validates any candidate URL, hostname, or credential string to guarantee it does
 * NOT target the original alinew production Supabase instance or corporate endpoints.
 */
export function assertNotProductionEndpoint(value?: string | null, context = 'Supabase Resource'): void {
  if (!value || typeof value !== 'string') return;
  const normalized = value.toLowerCase().trim();

  for (const ref of FORBIDDEN_PRODUCTION_PROJECT_REFS) {
    if (normalized.includes(ref)) {
      const msg = `[CRITICAL ISOLATION ENFORCEMENT] Blocked access to forbidden production project ref "${ref}" in ${context}. The AMD Hackathon repository MUST use a dedicated, independent database.`;
      console.error(msg);
      throw new FatalIsolationViolationError(msg);
    }
  }

  for (const domain of FORBIDDEN_PRODUCTION_DOMAINS) {
    if (normalized.includes(domain)) {
      const msg = `[CRITICAL ISOLATION ENFORCEMENT] Blocked access to forbidden production domain "${domain}" in ${context}. Access to production rasali535/alinew infrastructure is strictly forbidden.`;
      console.error(msg);
      throw new FatalIsolationViolationError(msg);
    }
  }
}

/**
 * Validates the runtime environment at startup, auditing all relevant environment
 * variables for forbidden production endpoints or credentials.
 */
export function validateHackathonEnvironmentIsolation(): void {
  const envVarsToCheck: Array<[string, string | undefined]> = [
    ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL],
    ['SUPABASE_URL', process.env.SUPABASE_URL],
    ['DATABASE_URL', process.env.DATABASE_URL],
    ['DIRECT_URL', process.env.DIRECT_URL],
    ['SUPABASE_PROJECT_ID', process.env.SUPABASE_PROJECT_ID],
    ['NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL],
    ['API_BASE_URL', process.env.API_BASE_URL],
  ];

  for (const [name, val] of envVarsToCheck) {
    if (val) {
      assertNotProductionEndpoint(val, `environment variable ${name}`);
    }
  }
}
