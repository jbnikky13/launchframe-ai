import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

function clean(value: string | undefined) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') return NextResponse.json({ error: 'A project URL is required.' }, { status: 400 });
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http and https URLs are supported.');

    const response = await fetch(parsed.toString(), { headers: { 'User-Agent': 'LaunchFrameBot/0.1 (+project-analysis)' }, redirect: 'follow', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`The project returned HTTP ${response.status}.`);
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, noscript').remove();

    const title = clean($('meta[property="og:title"]').attr('content')) || clean($('title').text()) || parsed.hostname;
    const description = clean($('meta[property="og:description"]').attr('content')) || clean($('meta[name="description"]').attr('content')) || clean($('main').text()).slice(0, 500) || `Discover ${title}.`;
    const headings = $('h1, h2, h3').map((_, el) => clean($(el).text())).get().filter(Boolean).slice(0, 8);
    const links = $('a').map((_, el) => clean($(el).text())).get().filter(t => t.length > 2 && t.length < 80);
    const features = [...new Set([...headings, ...links])].slice(0, 5);

    const analysis = {
      title,
      description,
      features: features.length ? features : ['Clear product experience', 'Focused user workflow', 'Built for your target audience'],
      hook: `Meet ${title} — a simpler way to get more from your workflow.`,
      benefit: description.length > 180 ? `${description.slice(0, 177)}…` : description,
      cta: `Try ${title} today.`
    };

    return NextResponse.json({ analysis, source: { url: parsed.toString(), images: $('meta[property="og:image"]').attr('content') ? [$('meta[property="og:image"]').attr('content')] : [] } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to analyze this project.';
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
