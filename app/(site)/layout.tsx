import type { ReactNode } from "react";
import "@/app/studio.css";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SiteFooter } from "@/app/components/SiteFooter";
import { MobileCta } from "@/app/components/MobileCta";
import { ContactWidget } from "@/app/components/ContactWidget";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <MobileCta />
      <ContactWidget />
    </>
  );
}