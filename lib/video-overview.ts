export type OverviewScene={
 order:number; duration:number; title:string;
 purpose:'hook'|'context'|'problem'|'feature'|'proof'|'cta';
 narration:string; visual:string; onScreenText:string;
 visualMode:'source'|'image'|'video'|'diagram'|'text';
 sourceAsset:'none'|'screenshot'|'logo'|'product';
 camera:'push-in'|'pull-out'|'pan-left'|'pan-right'|'parallax'|'static';
 transition:'cut'|'fade'|'zoom'|'match-cut';
};
export type VideoOverview={mode:'overview';title:string;thesis:string;audience:string;narration:string;totalDuration:number;scenes:OverviewScene[]};

function extractJson(text:string){const cleaned=text.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'');const start=cleaned.indexOf('{');if(start<0)throw Error('Gemini returned no JSON object.');let d=0,s=false,e=false;for(let i=start;i<cleaned.length;i++){const c=cleaned[i];if(s){if(e)e=false;else if(c==='\\')e=true;else if(c==='"')s=false;continue}if(c==='"'){s=true;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return cleaned.slice(start,i+1)}throw Error('Gemini returned incomplete JSON.')}
function parse(text:string):VideoOverview{return JSON.parse(extractJson(text))}

export async function generateVideoOverview(input:{title:string;description:string;features:string[];format:string;visualStyle:string;steering:string;sourceImages:number}):Promise<VideoOverview>{
 const key=(process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY)?.trim().replace(/^['"]|['"]$/g,'');if(!key)throw Error('GEMINI_API_KEY is not configured.');
 const schema={mode:'overview',title:'string',thesis:'string',audience:'string',narration:'string',totalDuration:'number',scenes:[{order:'number',duration:'number',title:'string',purpose:'hook|context|problem|feature|proof|cta',narration:'string',visual:'string',onScreenText:'string',visualMode:'source|image|video|diagram|text',sourceAsset:'none|screenshot|logo|product',camera:'push-in|pull-out|pan-left|pan-right|parallax|static',transition:'cut|fade|zoom|match-cut'}]};
 const prompt=`You are LaunchFrame's autonomous visual director. You are NOT writing a normal ad storyboard. Design a complete visual narrative that will actually be rendered scene-by-scene.
Input product: ${input.title}
Description: ${input.description}
Features: ${input.features.join(', ')}
Format: ${input.format}; style: ${input.visualStyle}; source screenshots available: ${input.sourceImages}.
Creative direction: ${input.steering||'Intelligent, cinematic, clear.'}
Rules:
1. Think in visual storytelling, not template slots. Every scene must have a different visual idea.
2. Choose visualMode independently per scene: source when real UI is essential; image for generated cinematic artwork; video for motion-worthy moments; diagram for relationships/processes; text only when typography itself communicates.
3. Do not default every scene to product screenshots. Use screenshots only when showing the actual product improves understanding.
4. Create a beginning, development and resolution. Establish context/problem, introduce the product, demonstrate mechanisms/features, then resolve with the outcome and CTA.
5. Visual prompts must describe subject, composition, environment, lighting, camera, action and continuity. Do not merely repeat the narration.
6. Use match-cuts and visual continuity where useful. Never invent factual claims, customers, metrics or integrations.
7. Make narration one connected spoken story, not disconnected feature labels.
Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}. Create 6-10 scenes totaling 60-120 seconds.`;
 const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:.8}})});
 const p=await res.json().catch(()=>null);if(!res.ok)throw Error(p?.error?.message||`Gemini request failed (${res.status}).`);
 const text=p?.candidates?.[0]?.content?.parts?.[0]?.text;if(!text)throw Error('Gemini returned no overview.');
 return parse(text);
}
export function overviewToCreative(overview:VideoOverview){return {angle:overview.thesis,audience:overview.audience,hook:overview.scenes[0]?.narration||'',script:overview.narration,cta:overview.scenes.at(-1)?.narration||'',scenes:overview.scenes.map(s=>({order:s.order,duration:s.duration,purpose:s.purpose==='context'?'problem':s.purpose,narration:s.narration,visual:s.visual,onScreenText:s.onScreenText,visualMode:s.visualMode,camera:s.camera,transition:s.transition}))};}
