import { NextResponse } from 'next/server';
import { getPlatformProfiles } from '@/lib/platform';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const platforms = Array.isArray(body?.platforms) ? body.platforms.map(String) : [];
    if (!platforms.length) return NextResponse.json({ error: 'Select at least one platform.' }, { status: 400 });
    return NextResponse.json({ profiles: getPlatformProfiles(platforms) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Platform planning failed.' }, { status: 422 });
  }
}
