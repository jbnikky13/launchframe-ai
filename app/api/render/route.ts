import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRenderPlan } from '@/lib/render-plan';

async function triggerRenderWorker() {
  const token = process.env.GITHUB_WORKER_TOKEN;
  const repo = process.env.GITHUB_WORKER_REPO || 'jbnikky13/launchframe-ai';
  if (!token) {
    console.warn('[LaunchFrame] GITHUB_WORKER_TOKEN is not configured; scheduled worker remains the fallback.');
    return false;
  }
  const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'launchframe-render' }),
    cache: 'no-store',
  });
  if (!response.ok) {
    console.error('[LaunchFrame worker trigger]', response.status, await response.text());
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.videoPlan) return NextResponse.json({ error: 'Video plan is required.' }, { status: 400 });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !key) return NextResponse.json({ error: 'Supabase server configuration is missing.' }, { status: 500 });
    const renderPlan = createRenderPlan(body.videoPlan);
    if (!renderPlan.scenes.length) return NextResponse.json({ error: 'The video plan contains no scenes.' }, { status: 400 });
    const cleanPlan = JSON.parse(JSON.stringify(renderPlan)) as typeof renderPlan;
    const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.from('launchframe_render_jobs').insert({ status: 'queued', progress: 0, render_plan: cleanPlan }).select('id,status,progress,created_at,updated_at').single();
    if (error) {
      console.error('[LaunchFrame render queue]', error);
      return NextResponse.json({ error: `Unable to queue render: ${error.message}` }, { status: 500 });
    }
    const workerTriggered = await triggerRenderWorker();
    return NextResponse.json({
      job: { ...data, format: body.videoPlan.format, width: renderPlan.width, height: renderPlan.height, duration: renderPlan.duration },
      message: workerTriggered ? 'Render started.' : 'Render queued; scheduled worker will pick it up.',
      workerTriggered,
    }, { status: 202 });
  } catch (error) {
    console.error('[LaunchFrame render]', error);
    return NextResponse.json({ error: error instanceof Error ? `Unable to queue render: ${error.message}` : 'Unable to queue render.' }, { status: 500 });
  }
}
