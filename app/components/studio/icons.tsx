type P = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: "false" as const,
};

export function NoteMark({ className }: P) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="9" cy="17.5" rx="3.6" ry="2.7" transform="rotate(-20 9 17.5)" />
      <path d="M12.4 16.4V4.2l6.2 2.1v3.1" />
    </svg>
  );
}

export function PlayIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M8 5.4 18.6 12 8 18.6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function StopIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="6.6" y="6.6" width="10.8" height="10.8" rx="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12.8 9.4 17.6 19.5 6.9" />
    </svg>
  );
}

export function ThemeIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CopyIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <rect x="8.6" y="8.6" width="11" height="11" rx="2.2" />
      <path d="M15.4 5.4H6.6a2.2 2.2 0 0 0-2.2 2.2v8.8" />
    </svg>
  );
}

export function ArrowIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5" />
      <path d="M11 6 5 12l6 6" />
    </svg>
  );
}

export function ResetIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4.6 12a7.4 7.4 0 1 0 2.3-5.4" />
      <path d="M4.2 4.6v4.2h4.2" />
    </svg>
  );
}

export function ShuffleIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M4 6.5h3.4l9.2 11H20" />
      <path d="M4 17.5h3.4l3-3.6" />
      <path d="M13.6 9.7l3-3.2H20" />
      <path d="M17.6 3.9 20.2 6.5l-2.6 2.6" />
      <path d="M17.6 14.9l2.6 2.6-2.6 2.6" />
    </svg>
  );
}

export function ForkIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M8.4 3.6v7.2a3.6 3.6 0 0 0 7.2 0V3.6" />
      <path d="M12 14.4v6" />
    </svg>
  );
}

export function MetroIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M9 4h6l3.4 16H5.6z" />
      <path d="M12 18 15.6 7.4" />
      <path d="M8.2 13.4h7.6" />
    </svg>
  );
}

export function SendIcon({ className }: P) {
  return (
    <svg {...base} className={className}>
      <path d="M20.4 3.6 3.8 10.2l6.3 2.5 2.5 6.3z" />
      <path d="M10.1 12.7 20.4 3.6" />
    </svg>
  );
}