# LaunchFrame AI

LaunchFrame turns a project URL and optional screenshots into a marketing-video production pipeline.

## Current MVP

- Project URL intake
- Server-side website scraping
- Metadata, headings and CTA discovery
- Automatic hook, benefit and CTA generation
- Video template and aspect-ratio selection UI
- Responsive landing workspace

## Architecture

- **Vercel:** Next.js application and API routes
- **Supabase:** database, render-job queue and video storage
- **Railway:** long-running Docker render worker
- **FFmpeg + Chromium:** video rendering inside the worker container
- **Gemini:** optional narration/TTS through environment variables

The render worker is intentionally separate from the Next.js application because video rendering is a long-running background workload. It polls Supabase for queued jobs, renders the scenes, optionally adds Gemini narration, uploads the MP4 to Supabase Storage and marks the job completed.

## Deploy the render worker to Railway

1. Create a new Railway project.
2. Choose **Deploy from GitHub repo** and select `jbnikky13/launchframe-ai`.
3. Railway will use `railway.toml` and build `worker/Dockerfile` from the repository root.
4. Add these Railway service variables:

```text
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
SUPABASE_SERVICE_ROLE_KEY=<your Supabase service-role key>
GEMINI_API_KEY=<your Gemini API key>
GEMINI_TTS_MODEL=gemini-3.1-flash-tts-preview
GEMINI_TTS_VOICE=Kore
VOICE_VOLUME=1
WORKER_POLL_MS=5000
```

Never commit the Supabase service-role key or Gemini API key to GitHub.

The worker does not need a public HTTP port. Railway should keep it running as a worker service and restart it automatically if the process exits.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To run the worker locally, from the repository root:

```bash
cd worker
npm install
npm run start
```

The worker requires the Supabase and optional Gemini environment variables shown above.

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
