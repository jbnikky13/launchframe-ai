export type GeminiCreative={hook:string;benefit:string;cta:string;script:string;scenes:Array<{order:number;duration:number;purpose:string;narration:string;visual:string;onScreenText:string;characterStyle?:'stick'|'none';characterAction?:string}>};

function extractJson(text:string):string{
 const cleaned=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
 const start=cleaned.indexOf('{');
 if(start<0)throw new Error('Gemini returned no JSON object.');
 let depth=0;let inString=false;let escaped=false;
 for(let i=start;i<cleaned.length;i++){
  const ch=cleaned[i];
  if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue;}
  if(ch==='"'){inString=true;continue;}
  if(ch==='{')depth++;else if(ch==='}'){depth--;if(depth===0)return cleaned.slice(start,i+1);}
 }
 throw new Error('Gemini returned incomplete JSON.');
}

function parseCreative(text:string):GeminiCreative{
 const json=extractJson(text);
 try{return JSON.parse(json) as GeminiCreative;}catch(firstError){
  const repaired=json.replace(/,\s*([}\]])/g,'$1').replace(/[\u0000-\u001F]+/g,' ');
  try{return JSON.parse(repaired) as GeminiCreative;}catch{throw new Error(`Gemini creative JSON was invalid: ${firstError instanceof Error?firstError.message:'invalid JSON'}`);}
 }
}

export async function generateGeminiCreative(input:{title:string;description:string;features:string[];format:string;template:string;objective?:string;visualStyle?:string;steering?:string}):Promise<GeminiCreative>{
 const raw=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;const key=raw?.trim().replace(/^['\"]|['\"]$/g,'');if(!key)throw new Error('GEMINI_API_KEY is not configured.');
 const puppet=/puppet|stick|2d-story/i.test(input.template);
 const style=puppet?'Use an original simple black-line 2D puppet character as a recurring visual storyteller. Give the character clear actions such as presenting, walking, thinking, confused, pointing and celebrating. Do not imitate any named creator or copyrighted character.':`Use a ${input.visualStyle||'cinematic'} visual language with concrete, production-ready shots.`;
 const schema={hook:'string',benefit:'string',cta:'string',script:'string',scenes:[{order:'number',duration:'number',purpose:'string',narration:'string',visual:'string',onScreenText:'string',characterStyle:'stick or none',characterAction:'string'}]};
 const prompt=`Act as an advertising creative director. Return ONLY one valid JSON object. Never use markdown fences. Never put unescaped double quotes or line breaks inside JSON string values. Schema: ${JSON.stringify(schema)}. Product: ${input.title}. Description: ${input.description}. Features: ${input.features.join(', ')}. Format: ${input.format}. Template: ${input.template}. Advertising objective: ${input.objective||'awareness'}. Visual style: ${input.visualStyle||'cinematic'}. Creative steering: ${input.steering||'Make it memorable, polished and persuasive.'}. ${style} Build a strong first 2-second hook, vary shot composition, use real product visuals when useful, invent visual metaphors when screenshots cannot communicate the idea, keep on-screen text short, make the CTA explicit, and describe camera motion and transition intent inside each visual. Favor 5-8 purposeful scenes for short ads and avoid generic filler. Keep every duration numeric and every scene field present.`;
 const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.7}})});
 const payload=await response.json().catch(()=>null);if(!response.ok){const message=payload?.error?.message||`Gemini request failed (${response.status}).`;throw new Error(`Gemini authentication/request failed (${response.status}): ${message}`);}
 const text=payload?.candidates?.[0]?.content?.parts?.[0]?.text;if(!text)throw new Error('Gemini returned no creative output.');
 return parseCreative(text);
}
