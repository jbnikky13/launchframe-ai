import { NextResponse } from 'next/server';
import { createVideoPlan } from '@/lib/video';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.scenes) || body.scenes.length === 0) {
      return NextResponse.json({ error: 'Storyboard scenes are required.' }, { status: 400 });
    }

    const format = body.format === 'horizontal' || body.format === 'square' ? body.format : 'vertical';
    const plan = createVideoPlan({
      format,
      template: typeof body.template === 'string' ? body.template : 'product-launch',
      scenes: body.scenes,
      assetUrls: Array.isArray(body.assetUrls) ? body.assetUrls.filter((url: unknown): url is string => typeof url === 'string') : []
    });

    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Video planning failed.' }, { status: 422 });
  }
}
