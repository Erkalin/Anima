import type { ReactNode } from "react";
import "@/app/studio.css";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { MobileCta } from "@/app/components/MobileCta";
import { SoundProvider } from "@/app/components/studio/Sound";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SoundProvider>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <MobileCta />
    </SoundProvider>
  );
}