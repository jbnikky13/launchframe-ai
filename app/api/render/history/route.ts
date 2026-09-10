import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db
    .from('launchframe_render_jobs')
    .select('id,status,progress,output_url,error,created_at,updated_at,render_plan')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const jobs = await Promise.all((data ?? []).map(async (job) => {
    let download_url: string | null = null;
    if (job.status === 'completed') {
      const signed = await db.storage
        .from('launchframe-renders')
        .createSignedUrl(`renders/${job.id}.mp4`, 86400, { download: `launchframe-${job.id}.mp4` });
      if (!signed.error) download_url = signed.data.signedUrl;
    }

    const plan = job.render_plan as { width?: number; height?: number; totalDuration?: number; duration?: number } | null;
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      output_url: job.output_url,
      download_url,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
      width: plan?.width ?? 0,
      height: plan?.height ?? 0,
      duration: plan?.totalDuration ?? plan?.duration ?? 0,
    };
  }));

  return NextResponse.json({ jobs });
}
