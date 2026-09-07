import { readFile } from 'node:fs/promises';
import { renderScene, concatScenes, type RenderPlan } from './renderer';

async function main() {
  const input = process.argv[2];
  if (!input) throw new Error('Usage: npm run render -- <render-plan.json>');
  const plan = JSON.parse(await readFile(input, 'utf8')) as RenderPlan;
  const files: string[] = [];
  for (const [index, scene] of plan.scenes.entries()) {
    process.stdout.write(`Rendering ${scene.id} (${index + 1}/${plan.scenes.length})\n`);
    files.push(await renderScene(plan, scene, index));
  }
  const output = await concatScenes(files);
  process.stdout.write(`Completed: ${output}\n`);
}

main().catch(error => { console.error(error); process.exit(1); });
