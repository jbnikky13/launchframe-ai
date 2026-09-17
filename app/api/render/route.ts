import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRenderPlan } from '@/lib/render-plan';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStore(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...(init?.headers || {}), 'Cache-Control': 'no-store, max-age=0, must-revalidate' },
  });
}

class WorkerDispatchTimeout extends Error {
  constructor() {
    super('Render worker dispatch timed out. The job remains queued and the worker sweeper will pick it up automatically.');
    this.name = 'WorkerDispatchTimeout';
  }
}

async function triggerRenderWorker(jobId: string) {
  const token = process.env.GITHUB_WORKER_TOKEN;
  const repo = process.env.GITHUB_WORKER_REPO || 'jbnikky13/launchframe-ai';
  if (!token) throw new Error('Render worker is not configured: GITHUB_WORKER_TOKEN is missing.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_type: 'launchframe-render', client_payload: { job_id: jobId } }),
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Render worker dispatch failed (${response.status}). ${detail.slice(0, 300)}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw new WorkerDispatchTimeout();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  let createdJobId: string | undefined;
  const db = getDb();
  if (!db) return noStore({ error: 'Supabase server configuration is missing.' }, { status: 500 });

  try {
    const body = await request.json();
    if (!body?.videoPlan) return noStore({ error: 'Video plan is required.' }, { status: 400 });

    const renderPlan = createRenderPlan(body.videoPlan);
    if (!renderPlan.scenes.length) return noStore({ error: 'The video plan contains no scenes.' }, { status: 400 });

    const cleanPlan = JSON.parse(JSON.stringify(renderPlan));
    const { data, error } = await db
      .from('launchframe_render_jobs')
      .insert({ status: 'queued', progress: 0, render_plan: cleanPlan })
      .select('id,status,progress,created_at,updated_at')
      .single();

    if (error || !data) return noStore({ error: `Unable to queue render: ${error?.message || 'No job was created.'}` }, { status: 500 });
    createdJobId = data.id;

    const { data: verified, error: verifyError } = await db
      .from('launchframe_render_jobs')
      .select('id,status')
      .eq('id', data.id)
      .maybeSingle();
    if (verifyError || !verified) throw new Error('Render job was created but could not be verified. Please retry.');

    try {
      await triggerRenderWorker(verified.id);
    } catch (dispatchError) {
      if (dispatchError instanceof WorkerDispatchTimeout) {
        // Do not turn a network timeout into a false failure. The scheduled
        // sweeper will claim this still-queued job within five minutes.
        console.warn('[LaunchFrame render] Worker dispatch timed out; leaving job queued.', { jobId: verified.id });
        return noStore({
          job: { ...data, format: body.videoPlan.format, width: renderPlan.width, height: renderPlan.height, duration: renderPlan.duration },
          message: 'Render queued. The worker will continue automatically.',
          workerTriggered: false,
        }, { status: 202 });
      }

      const message = dispatchError instanceof Error ? dispatchError.message : 'Render worker dispatch failed.';
      await db.from('launchframe_render_jobs').update({ status: 'failed', error: message }).eq('id', verified.id).eq('status', 'queued');
      throw dispatchError;
    }

    return noStore({
      job: { ...data, format: body.videoPlan.format, width: renderPlan.width, height: renderPlan.height, duration: renderPlan.duration },
      message: 'Render started.',
      workerTriggered: true,
    }, { status: 202 });
  } catch (error) {
    console.error('[LaunchFrame render]', { jobId: createdJobId, error });
    return noStore({ error: error instanceof Error ? error.message : 'Unable to start render.', jobId: createdJobId }, { status: 500 });
  }
}
