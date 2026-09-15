import { NextResponse } from 'next/server';
import { createAudioPlan, type MusicMood, type VoiceTone } from '@/lib/audio';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body?.scenes) || !body.scenes.length) return NextResponse.json({ error: 'Scenes are required.' }, { status: 400 });
    const plan = createAudioPlan({ scenes: body.scenes, template: body.template, musicMood: body.musicMood as MusicMood | undefined, voiceTone: body.voiceTone as VoiceTone | undefined });
    return NextResponse.json({ plan });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Audio planning failed.' }, { status: 422 });
  }
}
