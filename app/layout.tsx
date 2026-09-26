import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "AI Candidate — Interview answer room", description: "A resume-grounded AI candidate simulation that listens and answers interview questions.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className="antialiased">{children}</body></html>; }
