import { NextResponse } from 'next/server';
import { createRenderPlan } from '@/lib/render-plan';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.videoPlan) return NextResponse.json({ error: 'Video plan is required.' }, { status: 400 });
    const renderPlan = createRenderPlan(body.videoPlan);
    const jobId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    return NextResponse.json({
      job: {
        id: jobId,
        status: 'queued',
        progress: 0,
        format: body.videoPlan.format,
        width: renderPlan.width,
        height: renderPlan.height,
        duration: renderPlan.duration,
        renderPlan
      },
      message: 'Render job queued. A worker can consume this plan and produce the MP4.'
    }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to queue render.' }, { status: 422 });
  }
}
