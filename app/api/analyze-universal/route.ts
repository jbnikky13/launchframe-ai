import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const mode = body?.mode === 'script' ? 'script' : 'url';
  const input = typeof body?.input === 'string' ? body.input.trim() : '';
  if (!input) return NextResponse.json({ error: 'A URL or script is required.' }, { status: 400 });
  if (mode === 'script') return NextResponse.json({ source: { type: 'script', platform: 'Direct input', images: [], rawText: input }, analysis: { title: body?.title || 'Untitled campaign', description: input, features: ['User-provided creative brief'], hook: `Discover ${body?.title || 'this product'}.`, benefit: input.slice(0, 180), cta: 'Learn more today.' } });
  try { const parsed = new URL(input); return NextResponse.json({ source: { type: 'url', platform: parsed.hostname, url: parsed.toString(), images: [] }, analysis: { title: parsed.hostname, description: `Create an advertisement from ${parsed.toString()}.`, features: ['Source URL ready for creative analysis'], hook: `Discover ${parsed.hostname}.`, benefit: 'Turn this source into a launch-ready advertisement.', cta: 'Learn more today.' } }); } catch { return NextResponse.json({ error: 'Please enter a valid URL.' }, { status: 422 }); }
}
