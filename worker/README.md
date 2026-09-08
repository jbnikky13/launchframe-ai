# LaunchFrame Render Worker

This directory contains the rendering worker. The web app queues a render plan; a separate worker consumes the plan and produces the MP4.

## Pipeline

1. Claim a render job from Supabase.
2. Resolve project assets.
3. Generate procedural 2D puppet SVG frames when requested.
4. Build scene clips with FFmpeg.
5. Burn captions into the scenes.
6. Concatenate scenes.
7. If `GEMINI_API_KEY` is configured, generate narration with Gemini TTS and mux it into the video.
8. Upload the finished MP4 to Supabase Storage.
9. Update the job to `completed` with a public download URL.

## Production runtime

Run this worker on a container/VM with Node.js, FFmpeg, Chromium/Playwright, librsvg and sufficient temporary disk.

Required secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional narration settings:
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
- `GEMINI_TTS_MODEL` — defaults to `gemini-3.1-flash-tts-preview`
- `GEMINI_TTS_VOICE` — defaults to `Kore`
- `VOICE_VOLUME` — defaults to `1`

The service-role key and Gemini key must never be exposed to the browser.

If Gemini TTS fails or the key is absent, the worker deliberately falls back to a silent MP4 instead of failing the entire render.

Before public launch, add durable retry/dead-letter handling, rate limits, upload size limits, SSRF/domain protection for URL ingestion, cleanup of expired render files, and observability.
