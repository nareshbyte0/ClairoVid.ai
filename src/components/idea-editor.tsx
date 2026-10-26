"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Draft = { topic: string; audience: string; notes: string; voicePreset: "indian_male" | "indian_female" };
type Voice = { id: Draft["voicePreset"]; label: string; available: boolean };
type TopicIdea = { title: string; angle: string };

export function IdeaEditor({ project }: { project: { id: string; title: string; draft: Draft; draftRevision: number } }) {
  const initialDraft = project.draft || { topic: "", audience: "", notes: "", voicePreset: "indian_male" as const };
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [save, setSave] = useState("Saved");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [ideas, setIdeas] = useState<TopicIdea[]>([]);
  const [brainstormBusy, setBrainstormBusy] = useState(false);
  const [brainstormError, setBrainstormError] = useState("");
  const draftRef = useRef(initialDraft);
  const revisionRef = useRef(project.draftRevision);
  const savedDraftRef = useRef(JSON.stringify(initialDraft));
  const savePromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    fetch("/api/voices").then(response => response.json()).then(data => setVoices(data.voices || [])).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("clairovid:project-create-result") === project.id) {
        sessionStorage.removeItem("clairovid:project-create-result");
        sessionStorage.removeItem("clairovid:project-create-key");
      }
    } catch {}
  }, [project.id]);

  useEffect(() => {
    function warnBeforeLosingEdits(event: BeforeUnloadEvent) {
      if (JSON.stringify(draftRef.current) === savedDraftRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLosingEdits);
    return () => window.removeEventListener("beforeunload", warnBeforeLosingEdits);
  }, []);

  const persistDraft = useCallback(async () => {
    if (savePromiseRef.current) return savePromiseRef.current;
    const request = (async () => {
      let conflict = false;
      try {
        while (true) {
          const submitted = draftRef.current;
          if (JSON.stringify(submitted) === savedDraftRef.current) {
            setSave("Saved");
            return;
          }
          setSave("Saving…");
          const response = await fetch(`/api/projects/${project.id}/draft`, {
            method: "PATCH", headers: { "content-type": "application/json" },
            body: JSON.stringify({ expectedRevision: revisionRef.current, draft: submitted }),
          });
          const data = await response.json();
          if (!response.ok) {
            conflict = response.status === 409;
            setSave(conflict ? "Conflict" : "Save failed");
            throw new Error(data.error || "Draft could not be saved.");
          }
          revisionRef.current = data.revision;
          savedDraftRef.current = JSON.stringify(data.draft || submitted);
          if (JSON.stringify(draftRef.current) === savedDraftRef.current) {
            setSave("Saved");
            return;
          }
        }
      } catch (reason) {
        if (!conflict) setSave("Save failed");
        throw reason;
      }
    })();
    savePromiseRef.current = request;
    try { await request; }
    finally { if (savePromiseRef.current === request) savePromiseRef.current = null; }
  }, [project.id]);

  useEffect(() => {
    if (JSON.stringify(draft) === savedDraftRef.current) return;
    const timer = setTimeout(() => {
      persistDraft().catch(error => setError(error instanceof Error ? error.message : "Your draft could not be saved."));
    }, 900);
    return () => clearTimeout(timer);
  }, [draft, persistDraft]);

  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    const updated = { ...draftRef.current, [key]: value };
    draftRef.current = updated;
    setDraft(updated);
    if (key !== "voicePreset") setIdeas([]);
    setSave("Unsaved");
    setError("");
  }

  async function brainstorm() {
    setBrainstormBusy(true);
    setBrainstormError("");
    try {
      const response = await fetch(`/api/projects/${project.id}/brainstorm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draftRef.current),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not brainstorm ideas.");
      setIdeas(data.ideas || []);
    } catch (reason) {
      setBrainstormError(reason instanceof Error ? reason.message : "Could not brainstorm ideas.");
    } finally {
      setBrainstormBusy(false);
    }
  }
  async function makeStoryboard() {
    setBusy(true); setError("");
    try {
      await persistDraft();
      const response = await fetch(`/api/projects/${project.id}/storyboards`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not generate storyboard.");
      sessionStorage.setItem(`storyboard:${project.id}`, JSON.stringify(data));
      window.location.assign(`/projects/${project.id}/storyboard`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return <section className="ideaLayout">
    <div className="ideaIntro">
      <div className="eyebrow">STEP 01 — START WITH AN IDEA</div>
      <h1>What would you<br/><em>like to explain?</em></h1>
      <p>A good explainer begins with one clear question. Add your teaching notes if you have them; ClairoVid will help shape the rest.</p>
      <div className="ideaHint"><span>✳</span><div><b>Not sure where to start?</b><small>Try a question you’ve heard someone ask—or a concept you wish more people understood.</small></div></div>
    </div>
    <div className="ideaForm">
      <div className="fieldHead"><label htmlFor="topic">What do you want to explain?</label><span>REQUIRED</span></div>
      <textarea id="topic" autoFocus maxLength={2000} placeholder="For example: Why does a river flow in one direction?" value={draft.topic} onChange={event => change("topic", event.target.value)}/>
      <div className="ideaBrainstorm">
        <div><b>Need a starting point?</b><small>Gemini can suggest three teaching angles from your topic and notes.</small></div>
        <button type="button" className="secondaryButton brainstormButton" disabled={brainstormBusy} onClick={brainstorm}>{brainstormBusy ? "Finding ideas…" : "Brainstorm with AI"}</button>
      </div>
      {brainstormError && <div className="formError" role="alert">{brainstormError}</div>}
      {ideas.length > 0 && <div className="ideaSuggestions" aria-label="Suggested teaching ideas">{ideas.map((idea, index) => <article className="ideaSuggestion" key={`${idea.title}-${index}`}><div><span>IDEA 0{index + 1}</span><b>{idea.title}</b><p>{idea.angle}</p></div><button type="button" className="useIdeaButton" onClick={() => { change("topic", idea.title); setIdeas([]); }}>Use idea</button></article>)}</div>}
      <div className="fieldHead optional"><label htmlFor="notes">Teaching notes <small>OPTIONAL</small></label><span>{draft.notes.length}/20,000</span></div>
      <textarea id="notes" className="notesInput" maxLength={20000} placeholder="Add facts, examples, a target audience, or the points you want covered…" value={draft.notes} onChange={event => change("notes", event.target.value)}/>
      <label className="audienceLabel" htmlFor="audience">Who is this for? <small>OPTIONAL</small></label>
      <input id="audience" maxLength={200} placeholder="e.g. curious 12-year-olds" value={draft.audience} onChange={event => change("audience", event.target.value)}/>
      <div className="voiceHead"><div><b>Choose a voice</b><small>English · Indian accent</small></div><span>V1 VOICES</span></div>
      <div className="voiceChoices">{voices.map(voice => <button key={voice.id} type="button" className={`voiceChoice ${draft.voicePreset === voice.id ? "chosen" : ""}`} disabled={!voice.available} onClick={() => change("voicePreset", voice.id)}><span className="voiceIcon">{voice.id.endsWith("male") ? "◉" : "◌"}</span><span>{voice.label}<small>{voice.available ? "Configured" : "Not configured yet"}</small></span>{draft.voicePreset === voice.id && <i>✓</i>}</button>)}</div>
      <div className="editorBottom"><span className={`saveText ${save === "Save failed" || save === "Conflict" ? "saveBad" : ""}`} aria-live="polite">● {save}</span>{save === "Save failed" && <button className="saveRetry" type="button" onClick={() => { setError(""); persistDraft().catch(reason => setError(reason instanceof Error ? reason.message : "Draft could not be saved.")); }}>Retry save</button>}<button className="button" disabled={busy || !draft.topic.trim() || save === "Conflict" || save === "Save failed"} onClick={makeStoryboard}>{busy ? "Creating your storyboard…" : "Create storyboard"}<span>→</span></button></div>
      {error && <div className="formError" role="alert">{error}</div>}
    </div>
    <div className="privacyLine">Your idea and notes stay private to your account. Review the AI-generated script before creating a video.</div>
  </section>;
}
