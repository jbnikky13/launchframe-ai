import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { createStickCharacter, stickmanSvg, type StickAction } from '../lib/stickman';

const execFileAsync = promisify(execFile);

type Scene = { id:string; duration:number; background:'asset'|'gradient'; assetUrl?:string; caption:string; stickman:boolean; stickAction?:string; transition:string };
export type RenderPlan = { width:number; height:number; fps:number; duration:number; scenes:Scene[] };

export async function renderScene(plan: RenderPlan, scene: Scene, index: number, outDir = './tmp/render') {
  await mkdir(outDir, { recursive:true });
  const output = `${outDir}/${scene.id}.mp4`;
  const inputs: string[] = [];
  if (scene.assetUrl) inputs.push('-i', scene.assetUrl);
  else inputs.push('-f','lavfi','-i',`color=c=0x111827:s=${plan.width}x${plan.height}:r=${plan.fps}`);
  let filter = `[0:v]scale=${plan.width}:${plan.height}:force_original_aspect_ratio=decrease,pad=${plan.width}:${plan.height}:(ow-iw)/2:(oh-ih)/2[bg]`;
  if (scene.stickman && scene.stickAction) {
    const character = createStickCharacter(scene.stickAction as StickAction, index);
    const svg = `${outDir}/${scene.id}.svg`;
    await writeFile(svg, stickmanSvg(character), 'utf8');
    inputs.push('-loop','1','-i',svg);
    const x = character.position === 'left' ? '40' : character.position === 'right' ? 'W-w-40' : '(W-w)/2';
    filter += `;[1:v]scale=${Math.round(plan.width*.22)}:-1[char];[bg][char]overlay=${x}:H-h-80[out]`;
  } else filter += ';[bg]null[out]';
  await execFileAsync('ffmpeg', [...inputs, '-t', String(scene.duration), '-filter_complex', filter, '-map','[out]', '-an', '-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',output]);
  return output;
}

export async function concatScenes(sceneFiles: string[], output = './tmp/render/launchframe.mp4') {
  const list = './tmp/render/concat.txt';
  await mkdir('./tmp/render',{recursive:true});
  await writeFile(list, sceneFiles.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'), 'utf8');
  await execFileAsync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);
  return output;
}
