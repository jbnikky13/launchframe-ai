export type OverviewScene={
  order:number;
  duration:number;
  title:string;
  purpose:'hook'|'context'|'problem'|'feature'|'proof'|'cta';
  narration:string;
  visual:string;
  onScreenText:string;
  sourceAsset:'none'|'screenshot'|'logo'|'product';
  motion:'push-in'|'pull-out'|'pan'|'parallax'|'static';
  transition:'fade'|'slide'|'zoom';
};
export type VideoOverview={
  mode:'overview';
  title:string;
  thesis:string;
  audience:string;
  narration:string;
  totalDuration:number;
  scenes:OverviewScene[];
};

function extractJson(text:string):string{
  const cleaned=text.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
  const start=cleaned.indexOf('{'); if(start<0) throw new Error('Gemini returned no JSON object.');
  let depth=0,inString=false,escaped=false;
  for(let i=start;i<cleaned.length;i++){const ch=cleaned[i];
    if(inString){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch==='"')inString=false;continue;}
    if(ch==='"'){inString=true;continue;}
    if(ch==='{')depth++; else if(ch==='}'&&--depth===0)return cleaned.slice(start,i+1);
  }
  throw new Error('Gemini returned incomplete JSON.');
}
function parse(text:string):VideoOverview{
  const json=extractJson(text);
  try{return JSON.parse(json) as VideoOverview;}catch{
    return JSON.parse(json.replace(/,\s*([}\]])/g,'$1').replace(/[\u0000-\u001F]+/g,' ')) as VideoOverview;
  }
}
export async function generateVideoOverview(input:{title:string;description:string;features:string[];format:string;visualStyle:string;steering:string;sourceImages:number}):Promise<VideoOverview>{
  const raw=process.env.GEMINI_API_KEY||process.env.GOOGLE_API_KEY;
  const key=raw?.trim().replace(/^['"]|['"]$/g,''); if(!key) throw new Error('GEMINI_API_KEY is not configured.');
  const schema={mode:'overview',title:'string',thesis:'string',audience:'string',narration:'string',totalDuration:'number',scenes:[{order:'number',duration:'number',title:'string',purpose:'hook|context|problem|feature|proof|cta',narration:'string',visual:'string',onScreenText:'string',sourceAsset:'none|screenshot|logo|product',motion:'push-in|pull-out|pan|parallax|static',transition:'fade|slide|zoom'}]};
  const prompt=`Act as LaunchFrame's AI documentary/video-overview director. Create a coherent 60-120 second explainer that feels researched and story-driven, not like a sequence of generic ads. Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}.
Product: ${input.title}. Description: ${input.description}. Features: ${input.features.join(', ')}. Output format: ${input.format}. Visual style: ${input.visualStyle}. Available source visuals: ${input.sourceImages}. Creative steering: ${input.steering||'Clear, intelligent, visual and engaging.'}.
Build 7-10 purposeful scenes. Establish the problem/context before explaining the product. Use concrete visual metaphors when screenshots do not communicate the idea. Use sourceAsset=screenshot when a real product UI should appear, logo for brand moments, product for a product-focused shot, otherwise none. Never invent specific metrics, customers, integrations or claims that were not supplied. Keep narration natural and connected across scenes. Keep on-screen text short. Each scene must have a distinct visual idea, camera motion and transition. Total duration should be between 60 and 120 seconds.`;
  const response=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{responseMimeType:'application/json',temperature:0.65}})});
  const payload=await response.json().catch(()=>null);
  if(!response.ok) throw new Error(payload?.error?.message||`Gemini request failed (${response.status}).`);
  const text=payload?.candidates?.[0]?.content?.parts?.[0]?.text; if(!text) throw new Error('Gemini returned no overview.');
  return parse(text);
}
export function fallbackVideoOverview(input:{title:string;description:string;features:string[]}):VideoOverview{
  const features=input.features.slice(0,5);
  const scenes:OverviewScene[]=[
    {order:1,duration:7,title:'The question',purpose:'hook',narration:`What if ${input.title} could make this experience much simpler?`,visual:'Open with an abstract visual metaphor for the problem.',onScreenText:`Meet ${input.title}`,sourceAsset:'none',motion:'push-in',transition:'fade'},
    {order:2,duration:10,title:'The context',purpose:'context',narration:input.description||`${input.title} is designed around a more focused way to solve the problem.`,visual:'Show the problem as a clear visual sequence before introducing the product.',onScreenText:'The problem is familiar.',sourceAsset:'none',motion:'pan',transition:'slide'},
    ...features.map((f,i)=>({order:i+3,duration:10,title:`Feature ${i+1}`,purpose:'feature' as const,narration:`${f}.`,visual:`Demonstrate ${f} with a concrete product visual or explanatory diagram.`,onScreenText:f,sourceAsset:'product' as const,motion:i%2?'parallax' as const:'push-in' as const,transition:i%2?'zoom' as const:'fade' as const})),
    {order:features.length+3,duration:9,title:'Close',purpose:'cta',narration:`Explore ${input.title} and see how the experience fits your workflow.`,visual:'Finish with a clean brand/product composition and clear action moment.',onScreenText:`Explore ${input.title}`,sourceAsset:'logo',motion:'pull-out',transition:'fade'}
  ];
  return {mode:'overview',title:input.title,thesis:input.description||`A clearer way to experience ${input.title}.`,audience:'People who need the problem solved.',narration:scenes.map(s=>s.narration).join(' '),totalDuration:scenes.reduce((a,s)=>a+s.duration,0),scenes};
}