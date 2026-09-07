# LaunchFrame Render Worker

This directory contains the rendering-worker contract. The web app queues a render plan; a separate worker consumes the plan and produces the MP4.

## Pipeline

1. Receive a render job.
2. Resolve project assets.
3. Generate procedural stickman SVG overlays when requested.
4. Build scene clips with FFmpeg.
5. Add captions and transitions.
6. Mix voiceover/music when supplied.
7. Concatenate scenes.
8. Upload the finished MP4 to object storage.
9. Update the job to `completed` with a download URL.

The worker is intentionally separated from Vercel serverless functions because FFmpeg rendering is CPU/memory intensive and should not block an HTTP request.

The current MVP uses a portable JSON render-plan contract so the worker can later run on a container host without changing the frontend API.
