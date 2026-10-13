-- Atomic shared inference budget for public hackathon evaluation.
-- Uses Postgres row locks, so limits hold across Vercel serverless instances.
CREATE TABLE IF NOT EXISTS public.hackathon_inference_usage (
  scope TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, subject_id, period_start)
);
ALTER TABLE public.hackathon_inference_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.hackathon_inference_usage FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.reserve_hackathon_inference(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  v_user_count INT;
  v_global_count INT;
BEGIN
  IF p_user_id IS NULL OR length(p_user_id) < 6 OR length(p_user_id) > 128 THEN
    RAISE EXCEPTION 'Invalid user identifier';
  END IF;
  -- Shared lock protects both writes as one all-or-nothing reservation.
  PERFORM pg_advisory_xact_lock(20261013, 913);
  INSERT INTO public.hackathon_inference_usage(scope,subject_id,period_start,used)
    VALUES ('global','all',v_period,0) ON CONFLICT DO NOTHING;
  INSERT INTO public.hackathon_inference_usage(scope,subject_id,period_start,used)
    VALUES ('user',p_user_id,v_period,0) ON CONFLICT DO NOTHING;
  SELECT used INTO v_user_count FROM public.hackathon_inference_usage
    WHERE scope='user' AND subject_id=p_user_id AND period_start=v_period FOR UPDATE;
  SELECT used INTO v_global_count FROM public.hackathon_inference_usage
    WHERE scope='global' AND subject_id='all' AND period_start=v_period FOR UPDATE;
  IF v_user_count >= 8 OR v_global_count >= 200 THEN
    RETURN jsonb_build_object('allowed',false,'remaining',greatest(0,8-v_user_count),
      'globalRemaining',greatest(0,200-v_global_count),'resetAt',v_period + interval '1 day');
  END IF;
  UPDATE public.hackathon_inference_usage SET used=used+1, updated_at=now()
    WHERE scope='user' AND subject_id=p_user_id AND period_start=v_period;
  UPDATE public.hackathon_inference_usage SET used=used+1, updated_at=now()
    WHERE scope='global' AND subject_id='all' AND period_start=v_period;
  RETURN jsonb_build_object('allowed',true,'remaining',7-v_user_count,
    'globalRemaining',199-v_global_count,'resetAt',v_period + interval '1 day');
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_hackathon_inference(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_hackathon_inference(TEXT) TO service_role;
