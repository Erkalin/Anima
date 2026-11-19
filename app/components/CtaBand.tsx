import { telegramPending } from "../data";
import { TelegramButton } from "./TelegramButton";

export function CtaBand() {
  return (
    <section className="dark cta-band">
      <div className="wrap">
        <div className="contact">
          <h2>حرف بزنیم</h2>
          <p className="contact-text">
            برای هماهنگی کلاس یا گرفتن نوازنده، در تلگرام پیام بده.
          </p>
          <TelegramButton variant="brass" size="lg" />
          {telegramPending && (
            <p className="pending pending-dark">
              نام کاربری تلگرام به‌زودی اضافه می‌شود.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
