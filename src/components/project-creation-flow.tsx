"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const idempotencyStorageKey = "clairovid:project-create-key";
const resultStorageKey = "clairovid:project-create-result";

export function ProjectCreationFlow() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(true);
  const requestActiveRef = useRef(false);
  const fallbackKeyRef = useRef("");

  useEffect(() => {
    if (requestActiveRef.current) return;
    requestActiveRef.current = true;
    const controller = new AbortController();
    let cancelled = false;

    async function create() {
      try {
        let pendingProjectId = "";
        try { pendingProjectId = sessionStorage.getItem(resultStorageKey) || ""; } catch {}
        if (pendingProjectId) {
          router.replace(`/projects/${pendingProjectId}/idea`);
          return;
        }

        let idempotencyKey = "";
        try { idempotencyKey = sessionStorage.getItem(idempotencyStorageKey) || ""; } catch {}
        if (!idempotencyKey) {
          idempotencyKey = fallbackKeyRef.current || crypto.randomUUID();
          fallbackKeyRef.current = idempotencyKey;
          try { sessionStorage.setItem(idempotencyStorageKey, idempotencyKey); } catch {}
        }

        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "content-type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify({ title: "" }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || typeof data.project?.id !== "string") throw new Error(data.error || "Your explainer could not be created.");

        try { sessionStorage.setItem(resultStorageKey, data.project.id); } catch {}
        if (!cancelled) router.replace(`/projects/${data.project.id}/idea`);
      } catch (cause) {
        if (cancelled || (cause instanceof DOMException && cause.name === "AbortError")) return;
        setError(cause instanceof Error ? cause.message : "Your explainer could not be created.");
        setBusy(false);
        requestActiveRef.current = false;
      }
    }

    void create();
    return () => {
      cancelled = true;
      controller.abort();
      requestActiveRef.current = false;
    };
  }, [retry, router]);

  return <main className="editorShell">
    <header className="editorHeader">
      <BrandLogo href="/dashboard" label="ClairoVid.ai — My videos" />
      <Link href="/dashboard" className="backLink">← My videos</Link>
      <div className="saveState">Private workspace</div>
    </header>
    <section className="projectCreationState" aria-live="polite">
      <span className="eyebrow">YOUR PRIVATE STUDIO</span>
      <h1>{error ? "Your idea is safe to retry." : "Starting your explainer…"}</h1>
      <p>{error || "We’re creating a private project so your topic can autosave as you work."}</p>
      {error ? <div className="projectCreationActions">
        <button type="button" className="button" onClick={() => { setError(""); setBusy(true); setRetry(value => value + 1); }}>Try again <span aria-hidden="true">↻</span></button>
        <Link className="secondaryButton" href="/dashboard">Back to My videos</Link>
      </div> : <div className="projectCreationProgress"><i/><span>{busy ? "Creating a private draft" : "Opening your idea"}</span></div>}
    </section>
  </main>;
}
