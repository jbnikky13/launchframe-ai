import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// DELETE /api/render/:id
// Removes the stored MP4 and its render-job history row.
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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

  // A missing storage object is harmless; the database record should still be removable.
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
