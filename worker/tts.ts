import { mkdir, writeFile } from 'node:fs/promises';

function wavFromPcm(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22); header.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * channels * bits / 8;
  header.writeUInt32LE(byteRate, 28); header.writeUInt16LE(channels * bits / 8, 32);
  header.writeUInt16LE(bits, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Generate one narration track for the whole video using Gemini TTS. */
export async function generateGeminiNarration(text: string, output = './tmp/render/narration.wav') {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim().replace(/^['\"]|['\"]$/g, '');
  if (!key) return undefined;
  const input = text.trim();
  if (!input) return undefined;
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';
  const voice = process.env.GEMINI_TTS_VOICE || 'Kore';
  const prompt = `Speak naturally and energetically for a short-form social video. Clear English, confident pacing, friendly delivery, brief pauses after sentences. Do not add words that are not in the script. Script:\n${input}`;
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, 'Api-Revision': '2026-05-20' },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: { type: 'audio' },
      generation_config: { speech_config: [{ voice }] }
    })
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok) throw new Error(payload?.error?.message || `Gemini TTS failed (${response.status}).`);
  const base64 = payload?.output?.audio?.data || payload?.output_audio?.data;
  if (!base64) throw new Error('Gemini TTS returned no audio data.');
  await mkdir('./tmp/render', { recursive: true });
  const wav = wavFromPcm(Buffer.from(base64, 'base64'));
  await writeFile(output, wav);
  return output;
}
