import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { getAuthDb } from "@/db/mongo";

export const auth = betterAuth({
  database: mongodbAdapter(getAuthDb()),
  emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 12 },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const key = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;
      if (!key || !from) throw new Error("Email verification is not configured.");
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [user.email], subject: "Verify your ClairoVid.ai email", html: `<p>Welcome to ClairoVid.ai.</p><p><a href="${url}">Verify your email address</a></p>` }) });
      if (!response.ok) throw new Error("Could not send the verification email.");
    },
  },
  trustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS || process.env.BETTER_AUTH_URL || "http://localhost:3000").split(",").map((s) => s.trim()),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});
