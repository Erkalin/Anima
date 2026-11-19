import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { getDb, storageMode } from "@/lib/db";
import { AdminTop } from "../AdminShell";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "تنظیمات" };
export const instant = false;

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const data = await getDb();
  return (
    <>
      <AdminTop title="تنظیمات" sub="نامِ آموزشگاه، وبلاگ و پیش‌فرضِ نوشته‌ها" />
      <SettingsForm
        settings={data.settings}
        authors={data.authors}
        mode={storageMode()}
        admin={admin}
      />
    </>
  );
}