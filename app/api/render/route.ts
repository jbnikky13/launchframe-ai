import { NextResponse } from 'next/server';
import { createRenderPlan } from '@/lib/render-plan';
import { createJob } from '@/../../worker/job';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.videoPlan) return NextResponse.json({ error:'Video plan is required.' }, { status:400 });
    const renderPlan = createRenderPlan(body.videoPlan);
    const job = createJob();
    return NextResponse.json({ job:{ ...job, format:body.videoPlan.format, width:renderPlan.width, height:renderPlan.height, duration:renderPlan.duration, renderPlan }, message:'Render job queued.' }, { status:202 });
  } catch (error) {
    return NextResponse.json({ error:error instanceof Error ? error.message : 'Unable to queue render.' }, { status:422 });
  }
}
