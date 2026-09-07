# LaunchFrame AI

LaunchFrame turns a project URL and optional screenshots into a marketing-video production pipeline.

## Current MVP

- Project URL intake
- Server-side website scraping
- Metadata, headings and CTA discovery
- Automatic hook, benefit and CTA generation
- Video template and aspect-ratio selection UI
- Responsive landing workspace

## Roadmap

1. Screenshot uploads and visual extraction
2. Gemini-powered project analysis and script generation
3. Editable storyboard and scene timeline
4. AI voiceover and captions
5. Async render jobs with progress/status
6. FFmpeg video rendering worker
7. Supabase Storage for finished MP4s
8. Download/share and video variations
9. Authentication, projects and usage limits

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

No API key is required for the current scraper-based MVP. AI provider keys will be added through environment variables in the next phase and must never be committed to Git.
