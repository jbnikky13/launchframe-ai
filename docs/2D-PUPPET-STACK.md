# LaunchFrame 2D Puppet Production Stack

LaunchFrame now has a `2d-puppet` template for short-form vertical videos.

## Stack

1. **Next.js + React** — editor/orchestration UI and API routes.
2. **Gemini 2.5 Flash** — optional AI script/storyboard generation. If no Gemini key is present, LaunchFrame keeps its deterministic fallback planner.
3. **Procedural SVG puppet** — original character generated in `lib/puppet.ts`; no stock character API is required.
4. **librsvg (`rsvg-convert`)** — converts puppet SVG frames to PNG inside the render worker.
5. **FFmpeg** — composes scenes, scales assets, overlays the animated puppet and burns captions into the final MP4.
6. **Supabase** — existing render queue/job state and asset storage.
7. **Docker worker** — the render worker carries FFmpeg, Chromium, librsvg and fonts; Vercel should host the web/API side while the worker runs separately.

## AI-assisted workflow

`URL → project analysis → Gemini script/storyboard → scene plan → puppet action selection → 12fps puppet frames → FFmpeg scene render → captions → scene concat → MP4`

The puppet template automatically maps scene intent to actions such as presenting, confused, pointing, thinking and celebrating. The renderer adds small body/head movement and alternating walking poses so the character is animated rather than a static sticker.

## Cheapest setup

- Gemini can be used on its current free tier for eligible models/usage; keep a fallback planner so the app can still create deterministic storyboards without the key.
- The puppet renderer is local and open-source tooling only.
- FFmpeg and librsvg run in the worker; there is no paid animation SaaS dependency.
- For production, only the compute time of the worker/hosting and any API usage beyond free quotas need to be paid.

## Character direction

The system intentionally creates its own simple line-art puppet instead of copying a creator's character. The goal is the same production language — expressive 2D puppet + fast captions + short-form pacing — while keeping the generated asset original.
