import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "ClairoVid.ai — Complex ideas, clearly in motion", description: "Create clear educational explainers with AI narration, motion graphics and captions." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
