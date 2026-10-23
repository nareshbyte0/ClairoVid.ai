"use client";
import { authClient } from "@/auth/client";
export function SignOut() { return <button className="signOut" onClick={async()=>{await authClient.signOut(); window.location.assign("/");}} aria-label="Sign out">↗</button>; }
