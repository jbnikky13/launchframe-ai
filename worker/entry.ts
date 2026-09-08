import { readFile } from 'node:fs/promises';
import { renderScene, concatScenes, type RenderPlan } from './renderer';
import { generateGeminiNarration } from './tts';
import { mixAudio } from './audio';

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: npm run render -- <render-plan.json>');
  const plan = JSON.parse(await readFile(input, 'utf8')) as RenderPlan;
  const files: string[] = [];
  for (const [index, scene] of plan.scenes.entries()) {
    process.stdout.write(`Rendering ${scene.id} (${index + 1}/${plan.scenes.length})\n`);
    files.push(await renderScene(plan, scene, index));
  }
  const silentOutput = await concatScenes(files, './tmp/render/silent.mp4');
  const narrationText = plan.scenes.map(scene => scene.narration?.trim()).filter(Boolean).join(' ');
  let output = silentOutput;
  try {
    const narration = await generateGeminiNarration(narrationText);
    if (narration) output = await mixAudio(silentOutput, { voiceoverPath: narration, voiceVolume: 1 }, './tmp/render/final.mp4');
  } catch (error) {
    // Keep rendering usable without TTS; the silent MP4 is still a valid result.
    console.warn(`TTS unavailable; returning silent video: ${error instanceof Error ? error.message : String(error)}`);
  }
  process.stdout.write(`Completed: ${output}\n`);
}

main().catch(error => { console.error(error); process.exit(1); });
