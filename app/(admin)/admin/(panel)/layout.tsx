import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, storageMode } from "@/lib/db";
import { AdminShell } from "./AdminShell";
import { ToastHost } from "@/app/components/admin/ui";

export const instant = false;

export default async function PanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();
  const data = await getDb();

  return (
    <AdminShell
      admin={admin}
      mode={storageMode()}
      brand={data.settings.brand}
      counts={{
        posts: data.posts.length,
        drafts: data.posts.filter((p) => p.status === "draft").length,
        media: data.media.length,
      }}
    >
      <ToastHost>{children}</ToastHost>
    </AdminShell>
  );
}