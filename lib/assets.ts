export type ProjectAsset = {
  id: string;
  name: string;
  url: string;
  kind: 'screenshot' | 'image';
  mimeType?: string;
};

export function normalizeAssets(input: unknown): ProjectAsset[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `asset-${index + 1}`,
      name: typeof item.name === 'string' ? item.name : `Screenshot ${index + 1}`,
      url: typeof item.url === 'string' ? item.url : '',
      kind: item.kind === 'image' ? 'image' : 'screenshot',
      mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined
    }))
    .filter(asset => asset.url);
}
