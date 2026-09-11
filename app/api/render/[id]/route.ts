import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const { data, error } = await db
    .from('launchframe_render_jobs')
    .select('id,status,progress,output_url,error,created_at,updated_at')
    .eq('id', params.id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Render job not found.' }, { status: 404 });

  let download_url: string | null = null;
  if (data.status === 'completed') {
    const signed = await db.storage
      .from('launchframe-renders')
      .createSignedUrl(`renders/${data.id}.mp4`, 3600, { download: `launchframe-${data.id}.mp4` });
    if (!signed.error) download_url = signed.data.signedUrl;
  }

  return NextResponse.json({ ...data, download_url });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const { data: job, error: lookupError } = await db
    .from('launchframe_render_jobs')
    .select('id,status')
    .eq('id', params.id)
    .single();

  if (lookupError || !job) return NextResponse.json({ error: 'Render job not found.' }, { status: 404 });
  if (job.status === 'rendering') {
    return NextResponse.json({ error: 'This render is still running. Delete it after rendering finishes.' }, { status: 409 });
  }

  const { error: storageError } = await db.storage
    .from('launchframe-renders')
    .remove([`renders/${params.id}.mp4`]);

  if (storageError) console.warn('[LaunchFrame delete storage]', storageError.message);

  const { error: deleteError } = await db
    .from('launchframe_render_jobs')
    .delete()
    .eq('id', params.id);

  if (deleteError) {
    console.error('[LaunchFrame delete job]', deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: params.id });
}
