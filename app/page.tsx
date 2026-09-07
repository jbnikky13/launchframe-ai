'use client';

import { FormEvent, useState } from 'react';

type Analysis = { title: string; description: string; features: string[]; hook: string; benefit: string; cta: string; };

export default function Home() {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('vertical');
  const [template, setTemplate] = useState('product-launch');
  const [status, setStatus] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  async function analyze(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setAnalysis(null);
    setStatus('Scraping and analyzing your project…');
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setAnalysis(data.analysis);
      setStatus('Analysis complete — your video brief is ready.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <main className="page">
      <nav className="nav"><div className="logo">LaunchFrame <span>AI</span></div><div className="badge">MVP • URL → VIDEO</div></nav>
      <section className="hero">
        <div className="eyebrow">Turn projects into launch content</div>
        <h1>Paste a project.<br />Get a promo video.</h1>
        <p>LaunchFrame analyzes your website, finds the strongest selling points, writes the script, and prepares a video-ready creative brief.</p>
        <form className="card" onSubmit={analyze}>
          <label className="label">Project URL</label>
          <div className="row"><input className="input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourproject.com" type="url" required /><button className="primary" disabled={!url.trim()}>{status ? 'Analyze again' : 'Analyze project'}</button></div>
          <div className="upload">📸 Optional screenshots — image upload pipeline coming next.</div>
          <div className="controls">
            <select className="select" value={template} onChange={e => setTemplate(e.target.value)}><option value="product-launch">Product Launch</option><option value="saas-demo">SaaS Demo</option><option value="ai-product">AI Product</option><option value="mobile-app">Mobile App</option></select>
            <select className="select" value={format} onChange={e => setFormat(e.target.value)}><option value="vertical">Vertical · 9:16</option><option value="horizontal">Horizontal · 16:9</option><option value="square">Square · 1:1</option></select>
          </div>
          {status && <div className="status">{status}</div>}
          {analysis && <div className="results">
            <div className="panel"><h3>{analysis.title}</h3><p>{analysis.description}</p><ul>{analysis.features.map((f, i) => <li key={i}>{f}</li>)}</ul></div>
            <div className="panel"><h3>Generated creative</h3><p><strong>Hook:</strong> {analysis.hook}</p><p><strong>Benefit:</strong> {analysis.benefit}</p><p><strong>CTA:</strong> {analysis.cta}</p><p><strong>Format:</strong> {format} · <strong>Template:</strong> {template}</p></div>
          </div>}
          <div className="footer">Rendering, voiceover, music, captions and MP4 export are the next pipeline stage.</div>
        </form>
      </section>
    </main>
  );
}
