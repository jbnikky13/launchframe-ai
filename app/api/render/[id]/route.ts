import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 500 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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
