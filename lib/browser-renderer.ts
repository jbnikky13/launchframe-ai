'use client';

import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
  getFirstEncodableVideoCodec,
} from 'mediabunny';

export type BrowserRenderScene = {
  id: string;
  start?: number;
  duration: number;
  background?: 'asset' | 'gradient' | 'generated';
  assetUrl?: string;
  caption: string;
  narration?: string;
  stickman?: boolean;
  stickAction?: string;
  transition?: 'fade' | 'slide' | 'zoom';
  motion?: 'push-in' | 'pull-out' | 'pan' | 'parallax' | 'static';
};

export type BrowserRenderPlan = {
  width: number;
  height: number;
  fps?: number;
  duration?: number;
  template?: string;
  scenes: BrowserRenderScene[];
};

type LoadedAsset = {
  url: string;
  image: HTMLImageElement;
};

export type BrowserRenderOptions = {
  onProgress?: (progress: number, message: string) => void;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  canvasWidth: number,
  canvasHeight: number,
  scale = 1,
  alpha = 1,
) {
  const source = image as CanvasImageSource & { naturalWidth?: number; naturalHeight?: number; width?: number; height?: number };
  const sourceWidth = Number(source.naturalWidth ?? source.width ?? 0);
  const sourceHeight = Number(source.naturalHeight ?? source.height ?? 0);
  if (!sourceWidth || !sourceHeight) return;

  const cover = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight) * scale;
  const width = sourceWidth * cover;
  const height = sourceHeight * cover;
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  sceneProgress: number,
) {
  if (!text?.trim()) return;

  const safe = text.trim();
  const maxWidth = width * 0.82;
  const fontSize = Math.max(38, Math.round(width * 0.052));
  ctx.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lines = wrapText(ctx, safe, maxWidth);
  const lineHeight = fontSize * 1.12;
  const blockHeight = lines.length * lineHeight + 48;
  const y = height * 0.78 - blockHeight / 2;
  const entrance = clamp(sceneProgress / 0.16);

  ctx.save();
  ctx.globalAlpha = entrance;
  roundedRect(ctx, width * 0.09, y, width * 0.82, blockHeight, 26);
  ctx.fillStyle = 'rgba(0,0,0,.58)';
  ctx.fill();

  ctx.fillStyle = '#fff';
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, y + 24 + lineHeight * index + lineHeight / 2);
  });
  ctx.restore();
}

function drawStickman(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  action = 'talking',
  progress = 0,
) {
  const x = width * 0.78;
  const y = height * 0.66;
  const scale = Math.max(0.7, width / 1080);
  const bounce = Math.sin(progress * Math.PI * 2) * 10 * scale;

  ctx.save();
  ctx.translate(x, y + bounce);
  ctx.scale(scale, scale);
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#fff';
  ctx.fillStyle = '#fff';

  ctx.beginPath();
  ctx.arc(0, -150, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#151515';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, -102);
  ctx.lineTo(0, 20);
  ctx.moveTo(0, -70);
  ctx.lineTo(action === 'pointing' ? 100 : -75, -110);
  ctx.moveTo(0, -70);
  ctx.lineTo(action === 'celebrating' ? 85 : 70, action === 'celebrating' ? -150 : -20);
  ctx.moveTo(0, 20);
  ctx.lineTo(-60, 110);
  ctx.moveTo(0, 20);
  ctx.lineTo(65, 105);
  ctx.stroke();

  if (action === 'confused' || action === 'thinking') {
    ctx.fillStyle = '#fff';
    ctx.font = '900 54px Arial';
    ctx.fillText('?', 70, -190);
  }

  ctx.restore();
}

function drawGeneratedBackdrop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: BrowserRenderScene,
  progress: number,
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#0b1020');
  gradient.addColorStop(0.5, '#182848');
  gradient.addColorStop(1, '#4b134f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 14; i++) {
    const angle = progress * Math.PI * 2 + i * 0.7;
    const radius = width * (0.18 + (i % 5) * 0.07);
    const x = width * 0.5 + Math.cos(angle) * radius;
    const y = height * 0.35 + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 4) * 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + (i % 3) * 0.025})`;
    ctx.fill();
  }

  // Keep generated backdrops intentionally visual-only. The scene's
  // narration/caption is rendered separately so we never depend on fields
  // that are not part of BrowserRenderScene.
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: BrowserRenderScene,
  image: HTMLImageElement | undefined,
  localProgress: number,
) {
  const motion = scene.motion || 'static';
  const eased = localProgress * localProgress * (3 - 2 * localProgress);
  const zoom =
    motion === 'push-in' || motion === 'parallax'
      ? 1 + eased * 0.08
      : motion === 'pull-out'
        ? 1.08 - eased * 0.08
        : 1;

  ctx.clearRect(0, 0, width, height);

  if (image) {
    drawCover(ctx, image, width, height, zoom);
    ctx.fillStyle = 'rgba(4,7,18,.34)';
    ctx.fillRect(0, 0, width, height);
  } else {
    drawGeneratedBackdrop(ctx, width, height, scene, localProgress);
  }

  const vignette = ctx.createLinearGradient(0, 0, 0, height);
  vignette.addColorStop(0, 'rgba(0,0,0,.08)');
  vignette.addColorStop(.62, 'rgba(0,0,0,.08)');
  vignette.addColorStop(1, 'rgba(0,0,0,.62)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (scene.stickman) {
    drawStickman(ctx, width, height, scene.stickAction, localProgress);
  }

  drawCaption(ctx, scene.caption, width, height, localProgress);

  const fade = Math.min(clamp(localProgress / 0.12), clamp((1 - localProgress) / 0.12));
  ctx.fillStyle = `rgba(255,255,255,${0.04 * fade})`;
  ctx.fillRect(0, 0, width, height);
}

async function loadAsset(url: string): Promise<LoadedAsset | null> {
  try {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image could not be loaded.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) return null;
    return { url, image };
  } catch {
    return null;
  }
}

export function canBrowserRender() {
  return (
    typeof window !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof VideoEncoder !== 'undefined' &&
    typeof VideoFrame !== 'undefined'
  );
}

export async function renderInBrowser(
  plan: BrowserRenderPlan,
  options: BrowserRenderOptions = {},
): Promise<Blob> {
  if (!canBrowserRender()) {
    throw new Error('Browser video encoding is not supported in this browser. Try a current Chrome or Edge browser.');
  }

  const fps = Math.max(12, Math.min(30, plan.fps || 30));
  const width = Math.max(2, Math.floor(plan.width));
  const height = Math.max(2, Math.floor(plan.height));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas rendering is unavailable.');

  const totalDuration =
    plan.duration ||
    plan.scenes.reduce((sum, scene) => sum + Math.max(.1, scene.duration), 0);

  options.onProgress?.(2, 'Checking browser video encoder…');

  const outputFormat = new Mp4OutputFormat({ fastStart: 'in-memory' });
  const codec = await getFirstEncodableVideoCodec(
    outputFormat.getSupportedVideoCodecs(),
    { width, height, frameRate: fps, quality: new Quality('high') },
  );
  if (!codec) {
    throw new Error('This browser cannot encode a supported video format at this resolution.');
  }

  const output = new Output({
    format: outputFormat,
    target: new BufferTarget(),
  });

  const videoSource = new CanvasSource(canvas, {
    codec,
    quality: new Quality('high'),
  });

  output.addVideoTrack(videoSource, { frameRate: fps });
  await output.start();

  const assets = new Map<string, HTMLImageElement>();
  const urls = Array.from(
    new Set(plan.scenes.map((scene) => scene.assetUrl).filter(Boolean) as string[]),
  );

  for (let index = 0; index < urls.length; index++) {
    options.onProgress?.(
      5 + Math.round((index / Math.max(1, urls.length)) * 10),
      `Loading visual ${index + 1} of ${urls.length}…`,
    );
    const asset = await loadAsset(urls[index]);
    if (asset) assets.set(asset.url, asset.image);
  }

  let frameNumber = 0;

  try {
    for (const scene of plan.scenes) {
      const duration = Math.max(0.1, scene.duration);
      const frameCount = Math.max(1, Math.ceil(duration * fps));
      const image = scene.assetUrl ? assets.get(scene.assetUrl) : undefined;

      for (let frame = 0; frame < frameCount; frame++) {
        const localProgress = frameCount <= 1 ? 1 : frame / (frameCount - 1);
        drawScene(ctx, width, height, scene, image, localProgress);

        const timestamp = frameNumber / fps;
        await videoSource.add(timestamp, 1 / fps);
        frameNumber++;

        const progress = 15 + Math.round((Math.min(timestamp, totalDuration) / totalDuration) * 80);
        options.onProgress?.(
          Math.min(95, progress),
          `Encoding video… ${Math.min(100, Math.round((timestamp / totalDuration) * 100))}%`,
        );
      }

    }

    options.onProgress?.(97, 'Finalizing MP4…');
    await output.finalize();

    const buffer = output.target.buffer;
    if (!buffer) throw new Error('Browser encoder returned an empty video.');
    options.onProgress?.(100, 'Video ready.');
    return new Blob([buffer], { type: 'video/mp4' });
  } catch (error) {
    try {
      await output.cancel();
    } catch {}
    throw error;
  }
}
