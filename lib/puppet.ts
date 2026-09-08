export type PuppetAction = 'idle' | 'walk' | 'talk' | 'thinking' | 'pointing' | 'celebrating' | 'confused';
export type PuppetEmotion = 'neutral' | 'happy' | 'curious' | 'confused';

export function puppetSvg({ action = 'idle', emotion = 'neutral', phase = 0, width = 420, height = 620 } : { action?: PuppetAction; emotion?: PuppetEmotion; phase?: number; width?: number; height?: number } = {}) {
 const x=width/2; const swing=Math.sin(phase*Math.PI*2); const bob=action==='walk'?Math.abs(swing)*8:Math.sin(phase*Math.PI*2)*2; const head=105+bob,top=164+bob,bottom=365+bob;
 const talking=action==='talk'&&Math.floor(phase*12)%3!==0;
 let la=`M ${x} ${top+45} L ${x-88} ${top+120}`,ra=`M ${x} ${top+45} L ${x+88} ${top+120}`;let ll=`M ${x} ${bottom} L ${x-68} 505`,rl=`M ${x} ${bottom} L ${x+68} 505`;
 if(action==='walk'){ll=`M ${x} ${bottom} L ${x-82-swing*22} 500`;rl=`M ${x} ${bottom} L ${x+82+swing*22} 500`;la=`M ${x} ${top+45} L ${x-72+swing*18} ${top+128}`;ra=`M ${x} ${top+45} L ${x+72-swing*18} ${top+128}`;}
 if(action==='talk'){la=`M ${x} ${top+45} L ${x-72+swing*10} ${top+118}`;ra=`M ${x} ${top+45} L ${x+72-swing*10} ${top+118}`;}
 if(action==='pointing')ra=`M ${x} ${top+45} L ${x+135} ${top+5}`;
 if(action==='thinking')ra=`M ${x} ${top+45} L ${x+48} ${head+58}`;
 if(action==='celebrating'){la=`M ${x} ${top+45} L ${x-105} ${top-45}`;ra=`M ${x} ${top+45} L ${x+105} ${top-45}`;}
 if(action==='confused'){la=`M ${x} ${top+45} L ${x-100} ${top+80}`;ra=`M ${x} ${top+45} L ${x+100} ${top+80}`;}
 const mouth=talking?`<ellipse cx="${x}" cy="${head+28}" rx="16" ry="11" fill="#111827" stroke="none"/>`:`<path d="M ${x-20} ${head+27} Q ${x} ${head+(emotion==='happy'?43:35)} ${x+20} ${head+27}"/>`;
 const brows=emotion==='confused'?`<path d="M ${x-32} ${head-12} L ${x-8} ${head-5} M ${x+8} ${head-5} L ${x+32} ${head-12}"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><g fill="none" stroke="#111827" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><circle cx="${x}" cy="${head}" r="56" fill="white"/>${brows}<circle cx="${x-18}" cy="${head-2}" r="5" fill="#111827" stroke="none"/><circle cx="${x+18}" cy="${head-2}" r="5" fill="#111827" stroke="none"/>${mouth}<path d="M ${x} ${top} Q ${x-10} ${top+100} ${x} ${bottom}"/><path d="${la}"/><path d="${ra}"/><path d="${ll}"/><path d="${rl}"/><path d="M ${x-82} 505 Q ${x-55} 520 ${x-25} 505"/><path d="M ${x+82} 505 Q ${x+55} 520 ${x+25} 505"/></g></svg>`;
}

export function puppetActionForStickman(action?: string): PuppetAction { if(action==='talking')return'talk'; if(action==='pointing')return'pointing'; if(action==='celebrating')return'celebrating'; if(action==='thinking')return'thinking'; if(action==='confused')return'confused'; return'walk'; }
