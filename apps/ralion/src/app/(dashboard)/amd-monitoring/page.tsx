'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@ralion/ui';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Send,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ShieldCheck,
  Terminal,
  Zap,
  Sparkles,
  TrendingUp,
  Palette,
  Server,
  Database,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { authFetch } from '@/lib/api-config';
import { useOrganization } from '@ralion/auth';

type ConnectionStatus = 'LIVE' | 'OFFLINE' | 'RATE_LIMITED' | 'SIMULATED';
type InitiatingModule = 'mari' | 'growth' | 'creative' | 'monitoring_test';

interface MonitoringOverview {
  connection: {
    status: ConnectionStatus;
    endpoint: string;
    hasApiKey: boolean;
    models: string[];
    selectedModel: string;
    latencyMs: number;
    isFixture: boolean;
    fixtureNotice?: string;
    error?: string;
    checkedAt: string;
  };
  usage: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    quota?: {
      tier: string;
      limit: number;
      remaining: number;
    };
    recent_requests?: any[];
    isFixture?: boolean;
    fixtureNotice?: string;
  };
  stats: {
    totalRequests: number;
    liveInferences: number;
    simulatedFixtures: number;
    errors: number;
    rateLimited: number;
    avgLatencyMs: number;
    byModule: Record<InitiatingModule, number>;
  };
  recentRequests: Array<{
    traceId: string;
    timestamp: string;
    module: InitiatingModule;
    model: string;
    promptSnippet: string;
    status: 'SUCCESS' | 'ERROR' | 'RATE_LIMITED' | 'SIMULATED';
    isRealAmdInference: boolean;
    latencyMs: number;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    errorMessage?: string;
  }>;
}

interface TestRunResult {
  traceId: string;
  latencyMs: number;
  model: string;
  module: InitiatingModule;
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  status: ConnectionStatus;
  isRealAmdInference: boolean;
  isFixture: boolean;
  fixtureNotice?: string;
  finishReason: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    label: 'Luxury Delta Safari Itinerary',
    prompt: 'Generate an exclusive 7-day fly-in luxury safari itinerary for high-net-worth travellers visiting private concessions in the Okavango Delta, focusing on bespoke conservation experiences.',
  },
  {
    label: 'Adventure Mobile Camping Brief',
    prompt: 'Draft an engaging marketing campaign angle targeting budget-conscious adventure travellers and overlanders for guided mokoro canoe trails across Moremi and Chobe.',
  },
  {
    label: 'Mari AI Eco-Tourism Intelligence',
    prompt: 'Analyze seasonal demand patterns for Botswana wildlife tourism and recommend pricing tiers that support local community conservation programs.',
  },
  {
    label: 'Creative Studio Storyboard',
    prompt: 'Create a conceptual visual storyboard highlighting sunset mokoro dugout canoes gliding through papyrus waterways, with aerial views of elephant herds.',
  },
];

export default function AmdMonitoringCentrePage() {
  const { workspace, organization } = useOrganization();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test Runner State
  const [selectedModel, setSelectedModel] = useState<string>('DeepSeek-V4-Flash-0731');
  const [selectedModule, setSelectedModule] = useState<InitiatingModule>('monitoring_test');
  const [testPrompt, setTestPrompt] = useState<string>(PRESET_PROMPTS[0].prompt);
  const [runningTest, setRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<TestRunResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedTrace, setCopiedTrace] = useState<string | null>(null);

  // Table Filter
  const [moduleFilter, setModuleFilter] = useState<'all' | InitiatingModule>('all');

  const loadMonitoringData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await authFetch('/api/ai/amd/monitoring');
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message || 'Failed to connect to AMD Monitoring Centre');
      } else {
        setData(body);
        setError(null);
        if (body.connection?.selectedModel && !selectedModel) {
          setSelectedModel(body.connection.selectedModel);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching AMD telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadMonitoringData();
  }, [workspace?.id]);

  const handleRunAmdTest = async () => {
    if (!testPrompt.trim()) return;
    setRunningTest(true);
    setTestError(null);

    try {
      const res = await authFetch('/api/ai/amd/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt.trim(),
          model: selectedModel,
          module: selectedModule,
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        setTestError(body.message || 'AMD test inference failed');
      } else {
        setTestResult(body);
        // Refresh telemetry ledger to show new request
        void loadMonitoringData(false);
      }
    } catch (err: any) {
      setTestError(err.message || 'Network failure dispatching AMD inference test');
    } finally {
      setRunningTest(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      setCopiedTrace(id);
      setTimeout(() => setCopiedTrace(null), 2500);
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'LIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE ROCm
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            SIMULATED
          </span>
        );
      case 'RATE_LIMITED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            RATE LIMITED
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            OFFLINE
          </span>
        );
    }
  };

  const getModuleBadge = (mod: InitiatingModule) => {
    switch (mod) {
      case 'mari':
        return <Badge variant="purple" className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Mari AI</Badge>;
      case 'growth':
        return <Badge variant="primary" className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Growth</Badge>;
      case 'creative':
        return <Badge variant="warning" className="flex items-center gap-1"><Palette className="w-3 h-3" /> Creative</Badge>;
      case 'monitoring_test':
      default:
        return <Badge variant="default" className="flex items-center gap-1 text-zinc-300"><Cpu className="w-3 h-3" /> Test Probe</Badge>;
    }
  };

  const filteredRequests = (data?.recentRequests || []).filter(
    (req) => moduleFilter === 'all' || req.module === moduleFilter
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black tracking-tight text-white">AMD AI Monitoring Centre</h1>
                {data && getStatusBadge(data.connection.status)}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Radeon Developer API & AMD Token Factory Telemetry · AMD Developer Hackathon ACT III
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadMonitoringData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Checking...' : 'Refresh Telemetry'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              const el = document.getElementById('run-amd-test-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white"
          >
            <Zap className="w-3.5 h-3.5" />
            Run AMD Test
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-center gap-3">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Simulated Fixture Notice (Requirement 10) */}
      {data?.connection.status === 'SIMULATED' && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold text-amber-300">Simulated Test Mode Active: </span>
              No server-side <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-200 font-mono text-[11px]">RADEON_API_KEY</code> detected in host environment.
              Offline developer test fixtures are active. Simulated test requests are strictly labeled and never reported as live AMD inference.
            </div>
          </div>
          <span className="shrink-0 text-[10px] text-amber-300/70 border border-amber-500/30 px-2 py-1 rounded bg-black/20">
            RULE 10 COMPLIANT
          </span>
        </div>
      )}

      {/* 3. Top Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Connection & Endpoint */}
        <Card className="bg-zinc-900/80 border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-rose-400" /> AMD Endpoint
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">GET /models</span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-white flex items-center gap-2">
              {data ? data.connection.status : 'Loading...'}
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-1 truncate" title={data?.connection.endpoint}>
              {data?.connection.endpoint || 'https://developer.amd.com.cn/...'}
            </div>
            <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Latency: {data ? `${data.connection.latencyMs}ms` : '—'}
            </div>
          </div>
        </Card>

        {/* Card 2: Active Model */}
        <Card className="bg-zinc-900/80 border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-400" /> Active Model
            </span>
            <Badge variant="purple" className="text-[10px] px-1.5 py-0">
              {data?.connection.models.length || 0} Available
            </Badge>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-white truncate" title={data?.connection.selectedModel}>
              {data?.connection.selectedModel || 'Loading model...'}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">ROCm-accelerated open LLM</p>
            <div className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Server-side API key protection
            </div>
          </div>
        </Card>

        {/* Card 3: Provider Token Usage (GET /usage) */}
        <Card className="bg-zinc-900/80 border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" /> Compute Usage
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">GET /usage</span>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-white">
              {data ? data.usage.total_tokens.toLocaleString() : '0'}{' '}
              <span className="text-xs font-normal text-zinc-500">tokens</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
              <span>Prompt: {data?.usage.prompt_tokens || 0}</span>
              <span>Completion: {data?.usage.completion_tokens || 0}</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Tier: {data?.usage.quota?.tier || 'INSTINCT_ENTERPRISE'}
            </div>
          </div>
        </Card>

        {/* Card 4: Hardware Verification State (Requirement 10) */}
        <Card className="bg-zinc-900/80 border-zinc-800 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" /> AMD Verification
            </span>
            <Badge variant={data?.stats.liveInferences ? 'success' : 'default'} className="text-[10px]">
              {data?.stats.liveInferences ? 'Verified Live' : 'Simulated Ledger'}
            </Badge>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-emerald-400">{data?.stats.liveInferences || 0}</span>
              <span className="text-xs text-zinc-400">Live Inferences</span>
            </div>
            <div className="text-[11px] text-amber-300/80 mt-1">
              {data?.stats.simulatedFixtures || 0} Simulated Fixtures
            </div>
            <div className="text-[10px] text-zinc-500 mt-2">
              Avg Roundtrip: {data ? `${data.stats.avgLatencyMs}ms` : '—'}
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Interactive "Run AMD Test" Panel (Requirements 3, 4, 5, 8, 13, 14, 15) */}
      <div id="run-amd-test-section">
        <Card className="bg-zinc-900/90 border-zinc-800 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-zinc-800/80 bg-zinc-950/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Terminal className="w-5 h-5 text-rose-500" />
                  Run AMD Inference Test
                </CardTitle>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Sends a real request to <code className="text-rose-400 font-mono">POST /chat/completions</code> with correlation tracking.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Module Selector (Requirement 8) */}
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                  <span className="text-[11px] text-zinc-400">Caller:</span>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value as InitiatingModule)}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="monitoring_test" className="bg-zinc-900 text-white">Monitoring Test</option>
                    <option value="mari" className="bg-zinc-900 text-white">Mari AI</option>
                    <option value="growth" className="bg-zinc-900 text-white">Growth Engine</option>
                    <option value="creative" className="bg-zinc-900 text-white">Creative Studio</option>
                  </select>
                </div>

                {/* Model Selector (Requirement 2) */}
                <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60">
                  <span className="text-[11px] text-zinc-400">Model:</span>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                  >
                    {(data?.connection.models || ['DeepSeek-V4-Flash-0731', 'Qwen3.8-Flash-Next', 'deepseek-ai/DeepSeek-V3', 'meta-llama/Meta-Llama-3-8B-Instruct']).map((m) => (
                      <option key={m} value={m} className="bg-zinc-900 text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Preset Prompt Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                Preset Test Scenarios:
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTestPrompt(preset.prompt)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <Zap className="w-3 h-3 text-rose-400" />
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Textarea */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                <span className="font-semibold text-zinc-300">Inference Prompt:</span>
                <span className={testPrompt.length > 3800 ? 'text-amber-400' : 'text-zinc-500'}>
                  {testPrompt.length} / 4,000 characters
                </span>
              </div>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value.slice(0, 4000))}
                rows={3}
                placeholder="Enter inference prompt for AMD Token Factory..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/40 transition-all font-mono"
              />
            </div>

            {testError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Throttled to max 15 tests/min · Correlation Trace ID auto-attached</span>
              </div>

              <Button
                variant="primary"
                onClick={() => void handleRunAmdTest()}
                disabled={runningTest || !testPrompt.trim()}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/40"
              >
                {runningTest ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Dispatching AMD Inference...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Run AMD Test
                  </>
                )}
              </Button>
            </div>

            {/* Test Execution Output Box (Requirements 4, 5, 10, 15) */}
            {testResult && (
              <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-inner">
                {/* Result Header & Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Inference Result
                    </span>

                    {/* Requirement 10: Strict distinction between Live vs Simulated */}
                    {testResult.isRealAmdInference ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        VERIFIED REAL AMD INFERENCE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        SIMULATED TEST FIXTURE — NOT LIVE AMD INFERENCE
                      </span>
                    )}

                    {getModuleBadge(testResult.module)}
                  </div>

                  {/* End-to-End Latency (Requirement 4) */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-400">
                      Latency: <strong className="text-white">{testResult.latencyMs} ms</strong>
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-zinc-400">
                      Model: <span className="text-zinc-200">{testResult.model}</span>
                    </span>
                  </div>
                </div>

                {/* Response Text */}
                <div className="rounded-lg bg-zinc-900/90 border border-zinc-800/90 p-4 font-mono text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {testResult.response}
                </div>

                {/* Token Telemetry & Correlation Trace ID (Requirements 5 & 15) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-xs text-zinc-400 border-t border-zinc-850">
                  <div className="flex items-center gap-4 font-mono">
                    <span>Prompt Tokens: <strong className="text-white">{testResult.usage.prompt_tokens}</strong></span>
                    <span>Completion: <strong className="text-white">{testResult.usage.completion_tokens}</strong></span>
                    <span>Total: <strong className="text-rose-400">{testResult.usage.total_tokens}</strong></span>
                  </div>

                  {/* Trace ID & Copy Action */}
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-500">Trace ID:</span>
                    <span className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {testResult.traceId}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(testResult.traceId, 'test-trace')}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      title="Copy Correlation Trace ID"
                    >
                      {copiedTrace === 'test-trace' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. Module Activity Distribution & Recent Request Ledger (Requirements 7, 8, 15) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Module Breakdown Sidebar (Requirement 8) */}
        <Card className="bg-zinc-900/80 border-zinc-800 lg:col-span-1 p-5">
          <CardTitle className="text-sm text-white flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-indigo-400" />
            Module Attribution
          </CardTitle>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Mari AI</span>
              </div>
              <span className="text-sm font-bold text-white">{data?.stats.byModule.mari || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span>Growth Engine</span>
              </div>
              <span className="text-sm font-bold text-white">{data?.stats.byModule.growth || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span>Creative Studio</span>
              </div>
              <span className="text-sm font-bold text-white">{data?.stats.byModule.creative || 0}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <Cpu className="w-4 h-4 text-rose-400" />
                <span>Monitoring Probes</span>
              </div>
              <span className="text-sm font-bold text-white">{data?.stats.byModule.monitoring_test || 0}</span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 space-y-2">
            <p className="flex justify-between">
              <span>Total Tracked Jobs:</span>
              <strong className="text-white">{data?.stats.totalRequests || 0}</strong>
            </p>
            <p className="flex justify-between">
              <span>Error Count:</span>
              <span className={data?.stats.errors ? 'text-rose-400 font-bold' : 'text-zinc-400'}>
                {data?.stats.errors || 0}
              </span>
            </p>
            <p className="flex justify-between">
              <span>Rate Limited (429):</span>
              <span className="text-zinc-400">{data?.stats.rateLimited || 0}</span>
            </p>
          </div>
        </Card>

        {/* Recent Requests Audit Table (Requirements 7, 8, 15) */}
        <Card className="bg-zinc-900/80 border-zinc-800 lg:col-span-3">
          <CardHeader className="border-b border-zinc-800/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                Recent AMD Inference Telemetry Ledger
              </CardTitle>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Real-time request log with end-to-end correlation trace IDs and module tags.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              {(['all', 'mari', 'growth', 'creative', 'monitoring_test'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setModuleFilter(filterKey)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors shrink-0 ${
                    moduleFilter === filterKey
                      ? 'bg-zinc-800 text-white font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {filterKey === 'all' ? 'All' : filterKey.replace('_', ' ')}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/60 text-zinc-400 font-medium border-b border-zinc-800/80">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Correlation Trace ID</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Tokens</th>
                    <th className="py-3 px-4">Latency</th>
                    <th className="py-3 px-4">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        No requests recorded for selected module filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req, i) => (
                      <tr key={req.traceId || i} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap font-sans">
                          {new Date(req.timestamp).toLocaleTimeString()}
                        </td>

                        {/* Trace ID with copy button */}
                        <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px] text-zinc-300" title={req.traceId}>
                              {req.traceId}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(req.traceId, `trace-${i}`)}
                              className="text-zinc-500 hover:text-white p-0.5"
                              title="Copy Trace ID"
                            >
                              {copiedTrace === `trace-${i}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Module Tag */}
                        <td className="py-3 px-4 whitespace-nowrap font-sans">
                          {getModuleBadge(req.module)}
                        </td>

                        {/* Model */}
                        <td className="py-3 px-4 text-zinc-400 truncate max-w-[120px]" title={req.model}>
                          {req.model}
                        </td>

                        {/* Tokens */}
                        <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                          {req.usage.total_tokens || 0}{' '}
                          <span className="text-[9px] text-zinc-500">
                            ({req.usage.prompt_tokens}/{req.usage.completion_tokens})
                          </span>
                        </td>

                        {/* Latency */}
                        <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                          {req.latencyMs}ms
                        </td>

                        {/* Verification Status (Requirement 10) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.isRealAmdInference ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              LIVE
                            </span>
                          ) : req.status === 'ERROR' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              ERROR
                            </span>
                          ) : req.status === 'RATE_LIMITED' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                              429 LIMIT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              SIMULATED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
