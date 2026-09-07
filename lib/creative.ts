export type CreativeInput = {
  title: string;
  description: string;
  features: string[];
  format: 'vertical' | 'horizontal' | 'square';
  template: string;
};

export type Scene = {
  order: number;
  duration: number;
  purpose: 'hook' | 'problem' | 'feature' | 'cta';
  narration: string;
  visual: string;
  onScreenText: string;
};

export type CreativeBrief = {
  angle: string;
  audience: string;
  hook: string;
  script: string;
  cta: string;
  scenes: Scene[];
};

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

export function createCreativeBrief(input: CreativeInput): CreativeBrief {
  const title = clean(input.title) || 'this product';
  const description = clean(input.description);
  const features = input.features.filter(Boolean).slice(0, 4);
  const angle = features.length
    ? `Show how ${title} turns its key features into a simpler user experience.`
    : `Show why ${title} is a simpler way to solve the problem it targets.`;
  const audience = 'People actively looking for a faster, simpler solution to the problem this product addresses.';
  const hook = `Still doing this the hard way? Meet ${title}.`;
  const benefit = description || 'Discover a focused experience designed to help you get results with less friction.';
  const cta = `Try ${title} today.`;

  const scenes: Scene[] = [
    { order: 1, duration: 3, purpose: 'hook', narration: hook, visual: 'Show the strongest project screenshot or homepage hero with a quick zoom.', onScreenText: hook },
    { order: 2, duration: 4, purpose: 'problem', narration: benefit, visual: 'Show the product interface and the workflow it simplifies.', onScreenText: 'Less friction. More results.' },
    ...features.slice(0, 3).map((feature, index): Scene => ({ order: index + 3, duration: 3, purpose: 'feature', narration: `${feature}.`, visual: `Highlight the interface area that demonstrates: ${feature}.`, onScreenText: feature })),
    { order: features.length + 3, duration: 4, purpose: 'cta', narration: cta, visual: 'Return to the product branding and show the clearest call-to-action.', onScreenText: cta }
  ];

  return { angle, audience, hook, script: scenes.map(scene => scene.narration).join(' '), cta, scenes };
}
