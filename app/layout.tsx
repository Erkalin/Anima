import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import "./themes.css";
import "katex/dist/katex.min.css";
import "./blog.css";
import { SvgDefs } from "./components/Art";
import { siteUrl } from "@/lib/blog";

const iranYekan = localFont({
  src: [
    { path: "../fonts/Iranyekan thin.ttf", weight: "100", style: "normal" },
    { path: "../fonts/Iranyekan light.ttf", weight: "300", style: "normal" },
    { path: "../fonts/Iranyekan.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Iranyekan medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Iranyekan bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/Iranyekan extrabold.ttf", weight: "800", style: "normal" },
    { path: "../fonts/Iranyekan black.ttf", weight: "900", style: "normal" },
    { path: "../fonts/Iranyekan extrablack.ttf", weight: "950", style: "normal" },
  ],
  variable: "--font-iranyekan",
  display: "swap",
});

const ghalam = localFont({
  src: "../fonts/Ghalam.ttf",
  variable: "--font-ghalam",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "آموزشگاه موسیقی آنیما | آموزش پیانو و ویولن",
    template: "%s | آنیما",
  },
  description:
    "آموزش پیانو و ویولن برای مبتدی‌ها، و اعزام نوازنده برای مراسم و دورهمی.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${iranYekan.variable} ${ghalam.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("anima:theme");if(/^(abnus|lajvard|arghavan|firuzeh|sahargah|nilufar|golab|bahar|zaferan|banafsheh)$/.test(t||""))document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <SvgDefs />
        {children}
      </body>
    </html>
  );
}