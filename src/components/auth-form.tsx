"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/auth/client";
import { BrandLogo } from "@/components/brand-logo";
export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [error, setError] = useState(""); const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const values = new FormData(event.currentTarget); const email = String(values.get("email")); const password = String(values.get("password"));
    try {
      const result = mode === "sign-up" ? await authClient.signUp.email({ name: String(values.get("name")), email, password }) : await authClient.signIn.email({ email, password, rememberMe: true });
      if (result.error) setError(result.error.message || "We couldn't complete that request.");
      else if (mode === "sign-up") { if (process.env.NODE_ENV !== "production") window.location.assign("/dashboard"); else setNotice("Check your inbox to verify your email before signing in."); }
      else window.location.assign("/dashboard");
    } catch { setError("Unable to connect right now. Please try again."); } finally { setBusy(false); }
  }
  return <main className="authPage"><BrandLogo href="/" label="ClairoVid.ai home"/><section className="authCard"><div className="eyebrow">YOUR CREATIVE STUDIO</div><h1>{mode === "sign-up" ? "Make room for a good idea." : "Welcome back."}</h1><p>{mode === "sign-up" ? "Create your private workspace and start with one thing you want to explain." : "Sign in to pick up where your idea left off."}</p><form onSubmit={submit}>{mode === "sign-up" && <label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label>}<label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={mode === "sign-up" ? 12 : 1} required/></label>{error && <div className="formError" role="alert">{error}</div>}{notice && <div className="formNotice" role="status">{notice}</div>}<button className="button authSubmit" disabled={busy}>{busy ? "One moment…" : mode === "sign-up" ? "Create account" : "Sign in"}<span>↗</span></button></form><div className="authSwitch">{mode === "sign-up" ? <>Already have an account? <Link href="/sign-in">Sign in</Link></> : <>New to ClairoVid? <Link href="/sign-up">Create an account</Link></>}</div></section><div className="authFoot">Complex ideas, clearly in motion.</div></main>;
}
