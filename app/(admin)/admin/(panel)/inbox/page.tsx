import type { Metadata } from "next";
import { AdminTop } from "../AdminShell";
import { Inbox } from "@/app/components/admin/Inbox";

export const metadata: Metadata = { title: "گفتگوها" };
export const instant = false;

export default function InboxPage() {
  return (
    <>
      <AdminTop
        title="گفتگوها"
        sub="صندوق زندهٔ پیام‌های کاربران سایت — پاسخ، ویرایش، واکنش و بایگانی"
      />
      <Inbox />
    </>
  );
}