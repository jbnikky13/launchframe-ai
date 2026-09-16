import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function noStore(body: unknown, init?: ResponseInit) { return NextResponse.json(body, { ...init, headers: { ...(init?.headers || {}), 'Cache-Control': 'no-store, max-age=0, must-revalidate' } }); }
function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return noStore({ error: 'Server configuration missing.' }, { status: 500 });
  const { data, error } = await db.from('launchframe_render_jobs').select('id,status,progress,output_url,error,created_at,updated_at').eq('id', params.id).maybeSingle();
  if (error) return noStore({ error: error.message }, { status: 500 });
  if (!data) return noStore({ id: params.id, status: 'not_found', progress: 0, error: 'This render job is no longer available.' }, { status: 200 });
  let download_url: string | null = null;
  if (data.status === 'completed') {
    const signed = await db.storage.from('launchframe-renders').createSignedUrl(`renders/${data.id}.mp4`, 3600, { download: `launchframe-${data.id}.mp4` });
    if (!signed.error) download_url = signed.data.signedUrl;
  }
  return noStore({ ...data, download_url });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = getDb();
  if (!db) return noStore({ error: 'Server configuration missing.' }, { status: 500 });
  const id = params.id;
  const { data: job, error: lookupError } = await db.from('launchframe_render_jobs').select('id,status').eq('id', id).maybeSingle();
  if (lookupError) return noStore({ error: lookupError.message }, { status: 500 });
  if (!job) return noStore({ ok: true, id, alreadyDeleted: true, deleted: true });
  const { error: deleteError } = await db.from('launchframe_render_jobs').delete().eq('id', id);
  if (deleteError) return noStore({ error: deleteError.message }, { status: 500 });
  const { error: storageError } = await db.storage.from('launchframe-renders').remove([`renders/${id}.mp4`]);
  if (storageError) console.warn('[LaunchFrame delete storage]', storageError.message);
  return noStore({ ok: true, id, deleted: true, storageCleanupPending: Boolean(storageError) });
}
