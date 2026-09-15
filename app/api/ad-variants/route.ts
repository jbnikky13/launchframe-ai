import { NextResponse } from 'next/server';
import { createAdVariants } from '@/lib/ad-factory';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.title) return NextResponse.json({ error: 'Product title is required.' }, { status: 400 });
    return NextResponse.json({ variants: createAdVariants(String(body.title), String(body.description || ''), Array.isArray(body.selectedIds) ? body.selectedIds.map(String) : undefined) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Variant generation failed.' }, { status: 422 });
  }
}
