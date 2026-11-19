import { telegramHref } from "../data";
import { TelegramIcon } from "./Art";

export function TelegramButton({
  variant = "primary",
  size = "md",
  label = "پیام در تلگرام",
}: {
  variant?: "primary" | "brass";
  size?: "md" | "lg";
  label?: string;
}) {
  const classes = [
    "btn",
    variant === "brass" ? "btn-brass" : "btn-primary",
    size === "lg" ? "btn-lg" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      className={classes}
      href={telegramHref}
      target="_blank"
      rel="noopener noreferrer"
    >
      <TelegramIcon />
      {label}
    </a>
  );
}
