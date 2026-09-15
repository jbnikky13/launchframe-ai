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
  const { data, error } = await db.from('launchframe_render_jobs').select('id,status,progress,output_url,error,created_at,updated_at').eq('id', params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ id: params.id, status: 'not_found', progress: 0, error: 'This render job is no longer available.' }, { status: 200 });
  let download_url: string | null = null;
  if (data.status === 'completed') {
    const signed = await db.storage.from('launchframe-renders').createSignedUrl(`renders/${data.id}.mp4`, 3600, { download: `launchframe-${data.id}.mp4` });
    if (!signed.error) download_url = signed.data.signedUrl;
  }
  return NextResponse.json({ ...data, download_url });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const id = params.id;
  const { data: job, error: lookupError } = await db.from('launchframe_render_jobs').select('id,status').eq('id', id).maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!job) return NextResponse.json({ ok: true, id, alreadyDeleted: true });

  // Remove the database record immediately so the UI/history cannot keep showing the video.
  // Storage cleanup is attempted in the same request and is idempotent.
  const { error: deleteError } = await db.from('launchframe_render_jobs').delete().eq('id', id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const { error: storageError } = await db.storage.from('launchframe-renders').remove([`renders/${id}.mp4`]);
  if (storageError) console.warn('[LaunchFrame delete storage]', storageError.message);

  return NextResponse.json({ ok: true, id, deleted: true, storageCleanupPending: Boolean(storageError) }, { status: 200 });
}
