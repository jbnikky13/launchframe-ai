import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import { puppetActionForStickman, puppetSvg } from '../lib/puppet';

const execFileAsync = promisify(execFile);

type Scene = { id:string; duration:number; background:'asset'|'gradient'; assetUrl?:string; caption:string; stickman:boolean; stickAction?:string; transition:string };
export type RenderPlan = { width:number; height:number; fps:number; duration:number; scenes:Scene[] };

async function makePuppetFrames(scene: Scene, outDir: string, fps = 12) {
  const frames = Math.max(1, Math.ceil(scene.duration * fps));
  const frameDir = `${outDir}/${scene.id}-puppet`;
  await mkdir(frameDir, { recursive:true });
  const action = puppetActionForStickman(scene.stickAction);
  for (let i = 0; i < frames; i++) {
    const svg = puppetSvg({ action, emotion: scene.stickAction === 'confused' ? 'confused' : scene.stickAction === 'celebrating' ? 'happy' : 'neutral', phase: i / Math.max(1, frames - 1), width: 420, height: 620 });
    const svgPath = `${frameDir}/frame-${String(i).padStart(4,'0')}.svg`;
    const pngPath = `${frameDir}/frame-${String(i).padStart(4,'0')}.png`;
    await writeFile(svgPath, svg, 'utf8');
    await execFileAsync('rsvg-convert', ['-w','420','-h','620','-o',pngPath,svgPath]);
  }
  return frameDir;
}

function drawCaption(filter: string, captionPath?: string) {
  if (!captionPath) return filter;
  return `${filter};[out0]drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=${captionPath}:fontcolor=white:fontsize=54:line_spacing=12:box=1:boxcolor=black@0.48:boxborderw=24:x=(w-text_w)/2:y=h-300[out]`;
}

export async function renderScene(plan: RenderPlan, scene: Scene, index: number, outDir = './tmp/render') {
  await mkdir(outDir, { recursive:true });
  const output = `${outDir}/${scene.id}.mp4`;
  const inputs: string[] = [];
  if (scene.assetUrl) inputs.push('-stream_loop','-1','-i',scene.assetUrl);
  else inputs.push('-f','lavfi','-i',`color=c=0x808080:s=${plan.width}x${plan.height}:r=${plan.fps}`);

  let filter = `[0:v]scale=${plan.width}:${plan.height}:force_original_aspect_ratio=decrease,pad=${plan.width}:${plan.height}:(ow-iw)/2:(oh-ih)/2[bg]`;
  let maps = '[out0]';

  if (scene.stickman && scene.stickAction) {
    const frameDir = await makePuppetFrames(scene, outDir);
    inputs.push('-framerate','12','-i',`${frameDir}/frame-%04d.png`);
    filter += `;[1:v]scale=${Math.round(plan.width*.24)}:-1[char];[bg][char]overlay=x=(W-w)/2:y=H-h-70:shortest=0[out0]`;
  } else {
    filter += ';[bg]null[out0]';
  }

  let captionPath: string | undefined;
  if (scene.caption?.trim()) {
    captionPath = `${outDir}/${scene.id}-caption.txt`;
    await writeFile(captionPath, scene.caption.trim(), 'utf8');
    filter = drawCaption(filter, captionPath);
    maps = '[out]';
  }

  await execFileAsync('ffmpeg', [...inputs, '-t', String(scene.duration), '-filter_complex', filter, '-map',maps, '-an', '-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-movflags','+faststart',output]);
  return output;
}

export async function concatScenes(sceneFiles: string[], output = './tmp/render/launchframe.mp4') {
  const list = './tmp/render/concat.txt';
  await mkdir('./tmp/render',{recursive:true});
  await writeFile(list, sceneFiles.map(file => `file '${file.replaceAll("'", "'\\''")}'`).join('\n'), 'utf8');
  await execFileAsync('ffmpeg',['-y','-f','concat','-safe','0','-i',list,'-c','copy','-movflags','+faststart',output]);
  return output;
}
