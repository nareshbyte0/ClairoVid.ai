import { AuthForm } from "@/components/auth-form";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";

export const dynamic = "force-dynamic";

export default async function SignIn() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/dashboard");
  return <AuthForm mode="sign-in"/>;
}
