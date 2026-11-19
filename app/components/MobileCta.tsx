import { telegramHref, telegramPending } from "../data";
import { TelegramIcon } from "./Art";
import { SendIcon } from "./studio/icons";

export function MobileCta() {
  if (telegramPending) {
    return (
      <a className="mobile-cta" href="/contact#composer">
        <SendIcon />
        ساختن پیام
      </a>
    );
  }

  return (
    <a
      className="mobile-cta"
      href={telegramHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <TelegramIcon />
      پیام در تلگرام
    </a>
  );
}