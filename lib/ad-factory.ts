export type AdAngle = { id: string; name: string; hook: string; objective: string; direction: string };

export const DEFAULT_AD_ANGLES: AdAngle[] = [
  { id: 'problem', name: 'The Problem', hook: 'Still doing it the hard way?', objective: 'Expose the pain point quickly.', direction: 'Open on the problem, reveal the product as the relief, finish with a direct CTA.' },
  { id: 'curiosity', name: 'Curiosity', hook: 'There is a simpler way to do this.', objective: 'Create curiosity before revealing the product.', direction: 'Use mystery, visual reveals and short information gaps.' },
  { id: 'benefit', name: 'The Benefit', hook: 'Less friction. More results.', objective: 'Lead with the transformation.', direction: 'Show the desired outcome first, then prove how the product delivers it.' },
  { id: 'story', name: 'Mini Story', hook: 'This is what changed everything.', objective: 'Make the product memorable through narrative.', direction: 'Use a beginning, tension, transformation and satisfying CTA.' },
  { id: 'direct', name: 'Direct Response', hook: 'Meet the tool built to get this done.', objective: 'Drive clicks, signups or purchases.', direction: 'Use concise benefits, proof points and a strong action-oriented CTA.' }
];

export function createAdVariants(title: string, description: string, selectedIds?: string[]): AdAngle[] {
  const chosen = selectedIds?.length ? DEFAULT_AD_ANGLES.filter(a => selectedIds.includes(a.id)) : DEFAULT_AD_ANGLES;
  return chosen.map(angle => ({ ...angle, hook: angle.id === 'problem' ? `Still struggling with ${title}?` : angle.hook, direction: `${angle.direction} Product: ${title}. Context: ${description.slice(0, 240)}` }));
}
