import { NextResponse } from 'next/server';
import { createVisualPlan } from '@/lib/visual';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.scenes) || !body.scenes.length) return NextResponse.json({ error: 'Scenes are required.' }, { status: 400 });
    return NextResponse.json({ plan: createVisualPlan({ scenes: body.scenes, style: String(body.style || 'cinematic'), assetCount: Number(body.assetCount || 0) }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Visual planning failed.' }, { status: 422 });
  }
}
