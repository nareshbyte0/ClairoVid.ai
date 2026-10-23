import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth/server";
import { createProject } from "@/domain/project";
export const dynamic = "force-dynamic";
export default async function NewProject() { const user=(await auth.api.getSession({headers:await headers()}))?.user; if(!user) redirect("/sign-in"); const project=await createProject(user.id,""); redirect(`/projects/${project.id}/idea`); }
