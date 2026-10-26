"use client";
import { useState } from "react";
import { authClient } from "@/auth/client";

export function SignOut() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message || "Sign out failed.");
      window.location.assign("/");
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return <div className="signOutWrap">
    <button className="signOut" type="button" onClick={signOut} disabled={busy} aria-label="Sign out">
      <span aria-hidden="true">↗</span><span className="signOutLabel">{busy ? "Signing out…" : "Sign out"}</span>
    </button>
    {error && <span className="signOutError" role="alert">{error}</span>}
  </div>;
}
