import { writeFile } from 'node:fs/promises';

type Caption = { start:number; end:number; text:string };

export function buildCaptions(scenes: Array<{start:number; duration:number; caption:string}>): Caption[] {
  return scenes.filter(s => s.caption.trim()).map(s => ({ start:s.start, end:s.start+s.duration, text:s.caption.trim() }));
}

export async function writeSrt(captions: Caption[], path = './tmp/render/captions.srt') {
  const text = captions.map((c,i) => `${i+1}\n${toTimestamp(c.start)} --> ${toTimestamp(c.end)}\n${c.text}\n`).join('\n');
  await writeFile(path, text, 'utf8');
  return path;
}
function toTimestamp(seconds:number) { const ms=Math.max(0,Math.round(seconds*1000)); const h=Math.floor(ms/3600000); const m=Math.floor(ms%3600000/60000); const s=Math.floor(ms%60000/1000); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`; }
