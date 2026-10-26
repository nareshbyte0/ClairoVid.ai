import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth/server";
import { ProjectCreationFlow } from "@/components/project-creation-flow";

export const dynamic = "force-dynamic";

export default async function NewProject() {
  const user = (await auth.api.getSession({ headers: await headers() }))?.user;
  if (!user) redirect("/sign-in");

  return <ProjectCreationFlow />;
}
