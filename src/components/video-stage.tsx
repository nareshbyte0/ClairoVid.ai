"use client";
import { useRef, useState } from "react";
import type { WordCue } from "@/pipeline/captions";

function CaptionedAudio({ src, cues }: { src: string; cues: WordCue[] }) {
  const [time, setTime] = useState(0);
  const audio = useRef<HTMLAudioElement>(null);
  const active = cues.find(cue => time >= cue.start && time <= cue.end);
  return <div className="audioResult">
    <b>Narration preview</b><small>Your selected ClairoVid voice, generated for this approved storyboard.</small>
    <audio ref={audio} controls src={src} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} />
    <div className="liveCaption" aria-live="polite" aria-label="Synchronized caption preview">{active?.text || "Captions will follow the narration here."}</div>
  </div>;
}

export function VideoStage({ projectId, storyboardId }: { projectId: string; storyboardId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ audioUrl: string; notice: string; cues: WordCue[]; previewOnly?: boolean } | null>(null);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}/generations`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storyboardId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate narration.");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Generation failed."); }
    finally { setBusy(false); }
  }
  return <section className="videoStage">
    <div className="eyebrow">STEP 03 — GENERATE AND REVIEW</div>
    <h1>Hear your explanation<br/><em>come to life.</em></h1>
    <p>Generate narration from the approved storyboard. Word-timed captions are aligned to the ElevenLabs speech response.</p>
    <div className="renderPreview">
      <div className="previewGlyph">{result ? "♫" : "✳"}</div>
      {result ? <CaptionedAudio src={result.audioUrl} cues={result.cues} /> : <div><b>Your approved storyboard is ready.</b><small>Voice: ElevenLabs · English (India) · Captions: aligned to generated speech</small></div>}
    </div>
    {result ? <div className="integrationNotice"><b>{result.previewOnly ? "Temporary local audio preview" : "Video renderer not configured"}</b><p>{result.notice}</p><p>No MP4 has been rendered. The audio preview shows the selected voice and synchronized caption timing.</p></div> : <><button className="button" disabled={busy || !storyboardId} onClick={create}>{busy ? "Generating narration…" : "Generate narration and captions"}<span>→</span></button><p className="videoAvailability">This preview checks the voice and caption timing. Final MP4 rendering is not enabled yet.</p></>}
    {error && <div className="formError" role="alert">{error}</div>}
    <div className="qualityNote"><span>✓</span><p>{result?.previewOnly ? "Your storyboard stays approved and unchanged. This local audio and caption preview is temporary and is not saved." : "Your storyboard stays approved and unchanged. Persistent audio and caption files require private media storage."}</p></div>
  </section>;
}
