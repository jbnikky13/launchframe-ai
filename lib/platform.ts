export type Platform = 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'youtube' | 'x' | 'facebook' | 'linkedin';
export type PlatformProfile = { platform: Platform; width: number; height: number; maxDuration: number; safeTop: number; safeBottom: number; pacing: 'fast' | 'medium' | 'cinematic' };

export const PLATFORM_PROFILES: Record<Platform, PlatformProfile> = {
  tiktok: { platform:'tiktok', width:1080, height:1920, maxDuration:60, safeTop:180, safeBottom:260, pacing:'fast' },
  'instagram-reels': { platform:'instagram-reels', width:1080, height:1920, maxDuration:90, safeTop:180, safeBottom:260, pacing:'fast' },
  'youtube-shorts': { platform:'youtube-shorts', width:1080, height:1920, maxDuration:180, safeTop:140, safeBottom:220, pacing:'fast' },
  youtube: { platform:'youtube', width:1920, height:1080, maxDuration:600, safeTop:60, safeBottom:60, pacing:'cinematic' },
  x: { platform:'x', width:1080, height:1350, maxDuration:140, safeTop:100, safeBottom:140, pacing:'medium' },
  facebook: { platform:'facebook', width:1080, height:1350, maxDuration:240, safeTop:100, safeBottom:160, pacing:'medium' },
  linkedin: { platform:'linkedin', width:1920, height:1080, maxDuration:600, safeTop:70, safeBottom:70, pacing:'medium' }
};

export function getPlatformProfiles(platforms: string[]): PlatformProfile[] {
  return platforms.map(p => PLATFORM_PROFILES[p as Platform]).filter(Boolean);
}
