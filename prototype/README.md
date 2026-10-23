# ClairoVid.ai pipeline demo

This prototype runs a live Gemini → ElevenLabs → browser-rendered video flow for a river-flow explainer. Gemini creates the four-scene script; ElevenLabs creates narration and character timing; the browser renders moving scenes, timed captions, and audio into a WebM file. Provider calls use account quota.

## Run it

Run the local server so both provider endpoints are available. Open the app at the localhost URL (opening `index.html` as a `file://` URL disables the endpoints):

```powershell
& 'C:\Users\bhaga\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\prototype\server.js
```

Then open [http://127.0.0.1:4173](http://127.0.0.1:4173).

## What you can review

1. Enter a river-flow teaching idea and notes, then click **Generate storyboard with Gemini**.
2. Review/edit the four generated scenes and approve the storyboard snapshot.
3. Select River or Sarah, then click **Generate narration & timeline**. The local server calls ElevenLabs and builds speech-timed captions from its alignment response.
4. Preview the narrated video or continue to export a WebM containing the voice, animated scene canvas, and captions.

Gemini storyboard generation and ElevenLabs narration are live. The scene renderer is a small browser canvas implementation, not Remotion. Output is 360 × 640 WebM for prototype evaluation; MP4 rendering, cloud storage, project persistence, Inngest jobs, and Meta publishing are not connected.

The provider-backed pipeline requires network access and valid Gemini and ElevenLabs credentials in `.env.local`.

## Preparing for live provider integration

The server reads `.env.local` from the project root. Keep the Gemini API key, ElevenLabs API key, and both voice IDs there; the browser never receives the keys. If credentials were pasted into chat, rotate them and update `.env.local`. Never put secrets in `index.html`, commit `.env.local`, or paste replacement secrets into chat.
