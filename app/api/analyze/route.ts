import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

function clean(value: string | undefined) { return (value || '').replace(/\s+/g, ' ').trim(); }
function absolute(base: URL, value?: string) { if (!value) return null; try { return new URL(value, base).toString(); } catch { return null; } }

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'A project URL is required.' }, { status: 400 });
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https URLs are supported.');

    const response = await fetch(parsed.toString(), { headers: { 'User-Agent': 'LaunchFrameBot/0.2 (+project-analysis)' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`The project returned HTTP ${response.status}.`);
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();

    const title = clean($('meta[property="og:title"]').attr('content')) || clean($('title').text()) || parsed.hostname;
    const description = clean($('meta[property="og:description"]').attr('content')) || clean($('meta[name="description"]').attr('content')) || clean($('main').text()).slice(0, 500) || `Discover ${title}.`;
    const headings = $('h1, h2, h3').map((_, el) => clean($(el).text())).get().filter(Boolean).slice(0, 8);
    const links = $('a').map((_, el) => clean($(el).text())).get().filter(t => t.length > 2 && t.length < 80);
    const features = [...new Set([...headings, ...links])].slice(0, 5);

    const imageCandidates: string[] = [];
    const addImage = (value?: string) => { const u = absolute(parsed, value); if (u && !imageCandidates.includes(u)) imageCandidates.push(u); };
    addImage($('meta[property="og:image"]').attr('content'));
    addImage($('meta[name="twitter:image"]').attr('content'));
    addImage($('meta[property="og:image:url"]').attr('content'));
    $('img').each((_, el) => {
      addImage($(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src'));
      const srcset = $(el).attr('srcset') || $(el).attr('data-srcset');
      if (srcset) addImage(srcset.split(',')[0]?.trim().split(/\s+/)[0]);
    });
    $('source').each((_, el) => addImage($(el).attr('src')));
    const images = imageCandidates.filter(u => !/\.svg(?:\?|$)/i.test(u)).slice(0, 8);

    const analysis = {
      title,
      description,
      features: features.length ? features : ['Clear product experience', 'Focused user workflow', 'Built for your target audience'],
      hook: `Meet ${title} — a simpler way to get more from your workflow.`,
      benefit: description.length > 180 ? `${description.slice(0, 177)}…` : description,
      cta: `Try ${title} today.`
    };

    return NextResponse.json({ analysis, source: { url: parsed.toString(), images } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze this project.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
