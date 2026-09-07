# LaunchFrame Render Worker

This directory contains the rendering worker. The web app queues a render plan; a separate worker consumes the plan and produces the MP4.

## Pipeline

1. Receive and claim a render job from Supabase.
2. Resolve project assets.
3. Generate procedural stickman SVG overlays when requested.
4. Build scene clips with FFmpeg.
5. Generate captions and mix voiceover/music when supplied.
6. Concatenate scenes.
7. Upload the finished MP4 to Supabase Storage.
8. Update the job to `completed` with a signed download URL.
9. Mark failed jobs with an error so the UI can report them.

## Production runtime

Run this worker on a container/VM with Node.js, FFmpeg, Chromium/Playwright, and sufficient temporary disk. Required secrets are `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; the service-role key must never be exposed to the browser.

Before public launch, add durable retry/dead-letter handling, rate limits, upload size limits, SSRF/domain protection for URL ingestion, cleanup of expired render files, and observability.
