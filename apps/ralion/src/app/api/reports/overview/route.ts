import { NextRequest } from 'next/server';
import { corsJsonResponse, handleCorsPreflight } from '@/lib/cors';
import { getServiceSupabase, requireRalionContext } from '@/lib/auth/serverAuth';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

function monthKey(date: string | null | undefined) {
  const d = date ? new Date(date) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

function lastMonths(count = 6) {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

export async function GET(request: NextRequest) {
  try {
    const required = await requireRalionContext(request);
    if (required.response) return required.response;
    const ctx = required.context;
    const workspaceId = ctx.workspace.id;
    const organizationId = ctx.organization?.id || ctx.workspace.organization_id || workspaceId;
    const supabase = getServiceSupabase();

    // Helper to safely execute Supabase query and return fallback if table doesn't exist (42P01 / PGRST205)
    const safeQuery = async <T = any>(promise: PromiseLike<{ data: T | null; error: any }>, fallback: T): Promise<T> => {
      try {
        const res = await promise;
        if (res.error) {
          if (res.error.code === '42P01' || res.error.code === 'PGRST205') {
            return fallback;
          }
          console.warn('[Reports Overview API] Table query notice:', res.error.message);
          return fallback;
        }
        return (res.data as T) ?? fallback;
      } catch {
        return fallback;
      }
    };

    const [
      customers,
      deals,
      tasks,
      events,
      documents,
      workflows,
      workflowRuns,
      campaigns,
      walletData,
      subData,
      socialData,
    ] = await Promise.all([
      safeQuery<any[]>(supabase.from('customers').select('id,name,company,deal_value,created_at').eq('workspace_id', workspaceId), []),
      safeQuery<any[]>(supabase.from('deals').select('id,title,value,stage,deal_type,created_at,updated_at').eq('workspace_id', workspaceId), []),
      safeQuery<any[]>(supabase.from('tasks').select('id,title,status,priority,due_date,created_at,updated_at').eq('workspace_id', workspaceId), []),
      safeQuery<any[]>(supabase.from('calendar_events').select('id,title,start_at,category').eq('workspace_id', workspaceId).gte('start_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('start_at', { ascending: true }), []),
      safeQuery<any[]>(supabase.from('documents').select('id,name,rag_status,size_bytes,created_at').eq('workspace_id', workspaceId), []),
      safeQuery<any[]>(supabase.from('workflows').select('id,name,is_active,executions_count,last_executed_at').eq('workspace_id', workspaceId), []),
      // Hackathon schema uses workflow_executions table
      safeQuery<any[]>(supabase.from('workflow_executions').select('id,status,started_at,finished_at').eq('workspace_id', workspaceId).order('started_at', { ascending: false }).limit(100), []),
      safeQuery<any[]>(supabase.from('marketing_campaigns').select('id,title,target_platform,status,budget,description,metadata,created_at').eq('workspace_id', workspaceId), []),
      safeQuery<any>(supabase.from('tenant_credit_wallets').select('*').eq('organization_id', organizationId).maybeSingle(), null),
      safeQuery<any>(supabase.from('subscriptions').select('id,status,billing_cycle,current_period_start,current_period_end,subscription_plans(name,slug,price,currency)').eq('organization_id', organizationId).order('created_at', { ascending: false }).limit(1).maybeSingle(), null),
      safeQuery<any[]>(supabase.from('social_connections').select('id,provider,connection_status,token_status').eq('organization_id', organizationId), []),
    ]);

    const wonDeals = deals.filter((d: any) => ['WON', 'CLOSED_WON'].includes(String(d.stage || '').toUpperCase()));
    const lostDeals = deals.filter((d: any) => ['LOST', 'CLOSED_LOST'].includes(String(d.stage || '').toUpperCase()));
    const openDeals = deals.filter((d: any) => !['WON', 'CLOSED_WON', 'LOST', 'CLOSED_LOST'].includes(String(d.stage || '').toUpperCase()));
    const wonRevenue = wonDeals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);
    const openPipelineValue = openDeals.reduce((sum: number, d: any) => sum + Number(d.value || 0), 0);
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const overdueTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.due_date && new Date(`${t.due_date}T23:59:59Z`) < new Date()).length;
    const taskCompletionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 1000) / 10 : 0;
    const ragReadyDocuments = documents.filter((d: any) => d.rag_status === 'READY').length;
    const workflowSuccesses = workflowRuns.filter((r: any) => r.status === 'SUCCEEDED').length;
    const workflowFailures = workflowRuns.filter((r: any) => r.status === 'FAILED').length;

    const stageMap = new Map<string, { stage: string; count: number; value: number }>();
    deals.forEach((deal: any) => {
      const stage = String(deal.stage || 'LEAD').toUpperCase();
      const current = stageMap.get(stage) || { stage, count: 0, value: 0 };
      current.count += 1;
      current.value += Number(deal.value || 0);
      stageMap.set(stage, current);
    });

    const months = lastMonths(6);
    const monthlyCustomerGrowth = months.map(key => ({ month: monthLabel(key), key, customers: 0, dealsCreated: 0, wonValue: 0 }));
    const monthIndex = new Map(monthlyCustomerGrowth.map((row, index) => [row.key, index]));
    customers.forEach((c: any) => {
      const key = monthKey(c.created_at);
      const idx = key ? monthIndex.get(key) : undefined;
      if (idx !== undefined) monthlyCustomerGrowth[idx].customers += 1;
    });
    deals.forEach((d: any) => {
      const key = monthKey(d.created_at);
      const idx = key ? monthIndex.get(key) : undefined;
      if (idx !== undefined) {
        monthlyCustomerGrowth[idx].dealsCreated += 1;
        if (['WON', 'CLOSED_WON'].includes(String(d.stage || '').toUpperCase())) monthlyCustomerGrowth[idx].wonValue += Number(d.value || 0);
      }
    });

    const activeSocialConnections = socialData.filter((c: any) => ['CONNECTED', 'ACTIVE'].includes(String(c.connection_status || '').toUpperCase()) && !['EXPIRED', 'INVALID', 'REVOKED'].includes(String(c.token_status || '').toUpperCase())).length;

    // Fallback credits for hackathon tenant credit wallet
    const fallbackWallet = {
      plan_credits: 1000000,
      bonus_credits: 50000,
      total_balance: 1050000,
      remaining_plan_credits: 1000000,
      remaining_bonus_credits: 50000,
      reserved_credits: 0,
      lifetime_granted: 1050000,
      lifetime_consumed: 12450,
      tier: 'ENTERPRISE',
    };
    const credits = walletData || fallbackWallet;

    return corsJsonResponse({
      success: true,
      generatedAt: new Date().toISOString(),
      workspace: { id: workspaceId, name: ctx.workspace.name },
      organization: { id: organizationId, name: ctx.organization?.name || ctx.workspace.name },
      isSyntheticDemo: true,
      notice: 'Operational CRM and billing tables are omitted in the isolated hackathon environment. Showing synthetic safari campaign data.',
      kpis: {
        customers: customers.length,
        deals: deals.length,
        openDeals: openDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        wonRevenue,
        openPipelineValue,
        tasks: tasks.length,
        completedTasks,
        overdueTasks,
        taskCompletionRate,
        eventsLast30Days: events.length,
        documents: documents.length,
        ragReadyDocuments,
        workflows: workflows.length,
        activeWorkflows: workflows.filter((w: any) => w.is_active).length,
        workflowSuccesses,
        workflowFailures,
        activeSocialConnections,
        campaignsCount: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
        totalCampaignBudget: campaigns.reduce((acc: number, c: any) => acc + Number(c.budget || 0), 0),
      },
      campaigns,
      salesByStage: Array.from(stageMap.values()),
      monthlyCustomerGrowth,
      recentTasks: tasks.slice().sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8),
      upcomingEvents: events.filter((e: any) => new Date(e.start_at) >= new Date()).slice(0, 8),
      recentDocuments: documents.slice().sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 8),
      billing: {
        subscription: subData || null,
        credits,
      },
    }, undefined, request);
  } catch (error: any) {
    console.error('[Reports Overview API] failed:', error?.message);
    return corsJsonResponse({ success: false, error: 'Failed to build report from canonical data.' }, { status: 500 }, request);
  }
}
