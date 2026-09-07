export type StickAction = 'presenting' | 'thinking' | 'confused' | 'pointing' | 'celebrating';

export type StickCharacter = {
  enabled: boolean;
  action: StickAction;
  emotion: 'neutral' | 'curious' | 'confused' | 'happy';
  position: 'left' | 'center' | 'right';
  scale: number;
};

/**
 * Lightweight procedural character specification. The renderer can turn this
 * into SVG/Canvas frames without requiring a character asset or external API.
 * This keeps the video pipeline deterministic and makes stick characters easy
 * to place beside screenshots, captions and UI callouts.
 */
export function createStickCharacter(action: StickAction, index = 0): StickCharacter {
  const emotion = action === 'confused' ? 'confused' : action === 'celebrating' ? 'happy' : action === 'thinking' ? 'curious' : 'neutral';
  const positions: StickCharacter['position'][] = ['left', 'right', 'center'];
  return { enabled: true, action, emotion, position: positions[index % positions.length], scale: 1 };
}

export function stickmanSvg(character: StickCharacter, width = 420, height = 620): string {
  const x = width / 2;
  const headY = 105;
  const bodyTop = 155;
  const bodyBottom = 360;
  const stroke = '#111827';
  const action = character.action;
  const arm = action === 'pointing'
    ? `M ${x} 205 L ${x + 125} 170 M ${x} 205 L ${x - 75} 265`
    : action === 'celebrating'
      ? `M ${x} 205 L ${x - 105} 120 M ${x} 205 L ${x + 105} 120`
      : action === 'thinking'
        ? `M ${x} 205 L ${x - 85} 145 M ${x} 205 L ${x + 55} 125`
        : action === 'confused'
          ? `M ${x} 205 L ${x - 105} 235 M ${x} 205 L ${x + 90} 230`
          : `M ${x} 205 L ${x - 95} 250 M ${x} 205 L ${x + 95} 250`;

  const face = character.emotion === 'confused'
    ? `<path d="M ${x - 24} 112 Q ${x - 8} 100 ${x + 8} 112" fill="none" stroke="${stroke}" stroke-width="6"/><circle cx="${x - 15}" cy="90" r="4"/><circle cx="${x + 18}" cy="90" r="4"/>`
    : `<circle cx="${x - 16}" cy="92" r="4"/><circle cx="${x + 16}" cy="92" r="4"/><path d="M ${x - 20} 116 Q ${x} ${character.emotion === 'happy' ? 135 : 126} ${x + 20} 116" fill="none" stroke="${stroke}" stroke-width="6"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g transform="translate(0,0) scale(${character.scale})" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><circle cx="${x}" cy="${headY}" r="55" fill="white"/>${face}<path d="M ${x} ${bodyTop} L ${x} ${bodyBottom}"/><path d="${arm}"/><path d="M ${x} ${bodyBottom} L ${x - 80} 505 M ${x} ${bodyBottom} L ${x + 80} 505"/></g></svg>`;
}
