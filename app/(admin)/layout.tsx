import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/admin.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/* The whole back room is session-gated: it blocks on the server by design. */
export const instant = false;

export default function AdminGroupLayout({ children }: { children: ReactNode }) {
  return children;
}