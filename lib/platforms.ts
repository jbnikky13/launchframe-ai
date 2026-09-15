export type PlatformProfile={id:string;name:string;width:number;height:number;maxSeconds:number;fps:number;safeArea:'vertical'|'standard';notes:string};
export const PLATFORM_PROFILES:Record<string,PlatformProfile>={
 'tiktok':{id:'tiktok',name:'TikTok',width:1080,height:1920,maxSeconds:60,fps:30,safeArea:'vertical',notes:'Keep captions and CTA inside central safe area.'},
 'instagram-reels':{id:'instagram-reels',name:'Instagram Reels',width:1080,height:1920,maxSeconds:90,fps:30,safeArea:'vertical',notes:'Keep key text away from interface overlays.'},
 'youtube-shorts':{id:'youtube-shorts',name:'YouTube Shorts',width:1080,height:1920,maxSeconds:60,fps:30,safeArea:'vertical',notes:'Fast hook and readable captions.'},
 'youtube':{id:'youtube',name:'YouTube',width:1920,height:1080,maxSeconds:180,fps:30,safeArea:'standard',notes:'Use wider compositions and longer explanatory beats.'},
 'x':{id:'x',name:'X',width:1080,height:1350,maxSeconds:140,fps:30,safeArea:'standard',notes:'Prioritize first-frame hook and readable text without audio.'},
 'facebook':{id:'facebook',name:'Facebook',width:1080,height:1350,maxSeconds:120,fps:30,safeArea:'standard',notes:'Strong captions for muted playback.'},
 'linkedin':{id:'linkedin',name:'LinkedIn',width:1080,height:1350,maxSeconds:120,fps:30,safeArea:'standard',notes:'Professional framing and clear business value.'}
};
export function getPlatformProfile(id:string){return PLATFORM_PROFILES[id]||PLATFORM_PROFILES['tiktok'];}
