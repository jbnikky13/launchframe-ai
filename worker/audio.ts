import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir } from 'node:fs/promises';
const execFileAsync=promisify(execFile);
export type AudioTracks={voiceoverPath?:string;musicPath?:string;voiceVolume?:number;musicVolume?:number};

export async function createFallbackMusic(duration:number,output='./tmp/render/music.wav'){
 await mkdir('./tmp/render',{recursive:true});
 const d=Math.max(1,duration);
 await execFileAsync('ffmpeg',['-y','-f','lavfi','-i',`sine=frequency=196:sample_rate=24000:duration=${d}`,'-af','volume=0.035','-c:a','pcm_s16le',output]);
 return output;
}

export async function mixAudio(videoPath:string,tracks:AudioTracks,output='./tmp/render/final.mp4'){
 await mkdir('./tmp/render',{recursive:true});const inputs=['-y','-i',videoPath];if(tracks.voiceoverPath)inputs.push('-i',tracks.voiceoverPath);if(tracks.musicPath)inputs.push('-i',tracks.musicPath);if(!tracks.voiceoverPath&&!tracks.musicPath)return videoPath;
 const filters:string[]=[];const labels:string[]=[];let i=1;
 if(tracks.voiceoverPath){filters.push(`[${i}:a]volume=${tracks.voiceVolume??1},apad[voice]`);labels.push('[voice]');i++;}
 if(tracks.musicPath){filters.push(`[${i}:a]volume=${tracks.musicVolume??0.16},apad[music]`);labels.push('[music]');}
 if(labels.length===1)filters.push(`${labels[0]}anull[aout]`);else filters.push(`${labels.join('')}amix=inputs=${labels.length}:duration=first:dropout_transition=2[aout]`);
 await execFileAsync('ffmpeg',[...inputs,'-filter_complex',filters.join(';'),'-map','0:v:0','-map','[aout]','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',output],{maxBuffer:1024*1024});return output;
}
