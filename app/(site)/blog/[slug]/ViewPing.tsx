"use client";

import { useEffect } from "react";
import { pingViewAction } from "@/lib/actions/views";

export function ViewPing({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `seen:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode: count the visit anyway */
    }
    const t = setTimeout(() => void pingViewAction(slug), 1200);
    return () => clearTimeout(t);
  }, [slug]);

  return null;
}