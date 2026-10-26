# ClairoVid.ai

V1 development app for creating educational explainers. Product scope and decisions: [Final V1 PRD](./Product%20Requirements%20Document%20-%20AI%20Educational%20Video%20Generation%20SaaS.md), [Application System Design](./ClairoVid.ai%20-%20Application%20System%20Design.md), [Pipeline Technical Design](./ClairoVid.ai%20-%20Pipeline%20Technical%20Design.md). Current implementation and one-feature-at-a-time plan: [Project Status](./PROJECT_STATUS.md).

## Stack

Next.js App Router, TypeScript, Better Auth, MongoDB Atlas, Gemini, ElevenLabs, Cloudflare R2, Inngest, Remotion and Meta Instagram API. Provider calls are made from server routes; credentials are never sent to the browser.

## Local setup

1. Use Node.js 22 LTS or newer and MongoDB Atlas (or a local replica set for transaction-backed workflows).
2. Copy `.env.example` to `.env.local` and fill in development credentials. `BETTER_AUTH_SECRET` must be a fresh random value at least 32 characters long. Email verification needs a working Resend account and a verified sender.
3. Install dependencies with `npm install`.
4. Create database indexes with `npm run db:indexes`.
5. Start the app with `npm run dev`, then open `http://localhost:3000`.

Do not paste API keys in source files, send them in chat, or commit `.env.local`. Rotate credentials that have been exposed. Use separate database, R2 bucket, Meta app and API credentials for local, staging and production.

## Implemented application paths

- Signed-out product home, account registration/sign-in, email verification callback through Better Auth, and a private personal dashboard.
- Private projects, owner-scoped idempotent project creation, revision-checked draft reads/writes, serialized Idea autosaving, Gemini brainstorming, and storyboard generation.
- Editable storyboard scenes, explicit approval, and ElevenLabs narration with timed caption cues. Audio/captions are persisted to private R2 only when R2 is configured; otherwise local development returns a temporary, unsaved audio preview. No MP4 is rendered yet.
- `/api/health` reports configuration presence only; it never returns credential values.

The existing `prototype/` remains an isolated evaluation demo and is not the Next.js app.

## V1 work still required before public launch

This repository contains the V1 app foundation; it does not yet meet the entire public V1 PRD. Email sending, R2 and curated public voice presets require account configuration. Video rendering still needs a detached Remotion/Vercel Sandbox adapter, durable Inngest workflows/outbox/recovery, caption editing and MP4 QA. Instagram OAuth/publishing/scheduling, rate limits and abuse controls, privacy/deletion flows, managed backups/restore, support materials, accessibility/content evaluation and production deployment remain launch gates. Do not describe those screens and integrations as operational until implemented and verified against the corresponding accounts. See [Project Status](./PROJECT_STATUS.md) for current feature-level truth and sequencing.

Production release is blocked until those gates are complete. Audio-only generation shown in the Video stage is not a finished MP4 video.
