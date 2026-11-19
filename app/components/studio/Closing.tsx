import Link from "next/link";
import { telegramPending } from "@/app/data";
import { Staff } from "@/app/components/Art";
import { TelegramButton } from "@/app/components/TelegramButton";

export function Closing({
  hand = "یک پیام کافی است",
  title = "بنشین پشت ساز، بقیه‌اش با ما",
  text = "برای هماهنگی کلاس یا گرفتن نوازنده برای مراسم، در تلگرام پیام بده. اسم ساز، سطح و وقتی که هستی را بنویس.",
}: {
  hand?: string;
  title?: string;
  text?: string;
}) {
  return (
    <section className="closing">
      <div className="closing-staff" aria-hidden="true">
        <Staff />
      </div>
      <div className="wrap closing-inner">
        <p className="closing-hand">{hand}</p>
        <h2 className="closing-title">{title}</h2>
        <p className="closing-text">{text}</p>
        <div className="closing-actions">
          <TelegramButton variant="brass" size="lg" />
          <Link className="btn btn-ghost btn-lg" href="/contact#composer">
            پیام را خودم می‌سازم
          </Link>
        </div>
        {telegramPending && (
          <p className="pending pending-dark">نام کاربری تلگرام به‌زودی اضافه می‌شود.</p>
        )}
      </div>
    </section>
  );
}