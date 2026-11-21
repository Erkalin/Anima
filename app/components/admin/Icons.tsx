import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  inbox: (
    <>
      <path d="M3.5 13.5 5.8 5.4a1.6 1.6 0 0 1 1.5-1.2h9.4a1.6 1.6 0 0 1 1.5 1.2l2.3 8.1" />
      <path d="M3.5 13.5h4.6l1.2 2.2h5.4l1.2-2.2h4.6v4.7a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8z" />
    </>
  ),
  send: <path d="M20.5 3.5 10 14M20.5 3.5l-6.8 17-3.7-6.5L3.5 10.3z" />,
  smile: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.7 14.2s1.1 1.7 3.3 1.7 3.3-1.7 3.3-1.7M9.2 9.6h.01M14.8 9.6h.01" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1" />
      <path d="M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5M10 12.5h4" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="8.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.5" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.5" />
      <rect x="3" y="14.5" width="7.5" height="6.5" rx="1.5" />
    </>
  ),
  posts: (
    <>
      <path d="M5 3.5h9.5L19 8v12.5H5z" />
      <path d="M14 3.5V8h5M8.5 12.5h7M8.5 16h5" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 15.5l4.5-4.5 4 4 3-2.5 6.5 6" />
      <circle cx="8.5" cy="9" r="1.4" />
    </>
  ),
  taxonomy: (
    <>
      <path d="M3.5 6.5h7M3.5 12h11M3.5 17.5h7" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5l1.4 2.6 2.9-.6 1 2.8 2.6 1.4-1.3 2.6 1.3 2.6-2.6 1.4-1 2.8-2.9-.6L12 21.5l-1.4-2.6-2.9.6-1-2.8L4.1 15.3l1.3-2.6-1.3-2.6 2.6-1.4 1-2.8 2.9.6z" />
    </>
  ),
  logout: <path d="M15 4.5h4.5v15H15M11 8l-4 4 4 4M7 12h10" />,
  external: <path d="M14 4.5h5.5V10M19 5l-8.5 8.5M18 14v5.5H4.5V6H10" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  replace: <path d="M4 7h11l-3-3M20 17H9l3 3M4 7v4M20 17v-4" />,
  bold: <path d="M7 4.5h6a3.75 3.75 0 010 7.5H7zM7 12h7a3.75 3.75 0 010 7.5H7z" />,
  italic: <path d="M15.5 4.5h-5M13.5 19.5h-5M14 4.5l-4 15" />,
  strike: <path d="M5 12h14M8 8a3.5 3.5 0 013.5-3.5h2A3.5 3.5 0 0117 8M7 16a3.5 3.5 0 003.5 3.5h2.5A3.5 3.5 0 0016.5 16" />,
  inlinecode: <path d="M8.5 7.5L4 12l4.5 4.5M15.5 7.5L20 12l-4.5 4.5M13.5 5l-3 14" />,
  mark: <path d="M4 19.5h16M6.5 15.5l8-8 3 3-8 8H6.5zM13 5.5l2-2 3.5 3.5-2 2" />,
  brass: (
    <>
      <path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z" />
    </>
  ),
  hand: <path d="M4 17c3-6 5-9 6.5-9s1 3-.5 5.5S8 18 9.5 18s3-2.5 4.5-4 3-2 3.5-1-.5 3-2 4.5" />,
  kbd: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7 14h10" />
    </>
  ),
  badge: (
    <>
      <path d="M12 3l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.9 2.6-2.7-.2L12 21l-2.2-1.6-2.7.2-.9-2.6L4 15.4l1-2.5-1-2.5 2.2-1.6.9-2.6 2.7.2z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.6" />
    </>
  ),
  sup: <path d="M4 18l7-12M4 6l7 12M16 8.5c0-1.4 1-2.5 2.3-2.5S20.5 7 20.5 8.3c0 2-4.5 3-4.5 5.7h4.5" />,
  sub: <path d="M4 16l7-10M4 6l7 10M16 15.5c0-1.4 1-2.5 2.3-2.5s2.2 1 2.2 2.3c0 2-4.5 3-4.5 5.7h4.5" />,
  ltr: <path d="M4 7h12M4 12h9M4 17h12M17 14l3 3-3 3" />,
  num: <path d="M6 9.5c0-2 1.3-3.5 3-3.5s3 1.5 3 3.5-1.3 3.5-3 3.5-3-1.5-3-3.5zM9 13v5M16 6h2v12" />,
  h1: <path d="M4 6v12M11 6v12M4 12h7M15 9l2.5-2v11M15 18h5" />,
  h2: <path d="M4 6v12M11 6v12M4 12h7M15 8.5a2.5 2.5 0 115 0c0 2.5-5 3.5-5 7.5h5" />,
  h3: <path d="M4 6v12M11 6v12M4 12h7M15 7h4.5l-2.5 4a2.8 2.8 0 11-2 4.8" />,
  h4: <path d="M4 6v12M11 6v12M4 12h7M18.5 18V6l-4 8h5.5" />,
  ul: (
    <>
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.5" cy="6.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  ol: <path d="M9 6.5h11M9 12h11M9 17.5h11M3.5 5l1.5-1v4M3 11h2.5l-2.5 3h2.5M3 16.5h2.5v1.5H3.5v1.5H5.5" />,
  task: (
    <>
      <rect x="3" y="4.5" width="6" height="6" rx="1.4" />
      <rect x="3" y="13.5" width="6" height="6" rx="1.4" />
      <path d="M4.6 7.5l1.2 1.2 2.2-2.4M12.5 7.5h8M12.5 16.5h8" />
    </>
  ),
  quote: <path d="M9 6.5C6 7.5 4.5 9.5 4.5 12.5c0 2 1.2 3.5 3 3.5s2.8-1.3 2.8-3-1.2-2.8-2.7-2.8c-.3 0-.6 0-.8.1.3-1.4 1.3-2.4 2.7-3zM19 6.5c-3 1-4.5 3-4.5 6 0 2 1.2 3.5 3 3.5s2.8-1.3 2.8-3-1.2-2.8-2.7-2.8c-.3 0-.6 0-.8.1.3-1.4 1.3-2.4 2.7-3z" />,
  callout: (
    <>
      <path d="M4 5.5h16v11H9l-5 4z" />
      <path d="M12 8.5v3.5M12 14h.01" />
    </>
  ),
  toggle: <path d="M4 6.5h16M4 12h16M4 17.5h10M17 15l3 2.5-3 2.5" />,
  table: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.6" />
      <path d="M3 9.5h18M3 14.5h18M9.5 4.5v15M15 4.5v15" />
    </>
  ),
  divider: <path d="M3 12h18M6 7.5h12M6 16.5h12" />,
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 16l5-5 4 4 3-2.5 6 5.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
    </>
  ),
  video: (
    <>
      <rect x="2.5" y="5.5" width="14" height="13" rx="2" />
      <path d="M16.5 10l5-3v10l-5-3z" />
    </>
  ),
  audio: <path d="M9 17.5V6l11-2v11.5M9 17.5a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0zM20 15.5a2.75 2.75 0 11-5.5 0 2.75 2.75 0 015.5 0z" />,
  file: <path d="M6 3.5h8L19 8v12.5H6zM14 3.5V8h5M9 12.5h6M9 16h4" />,
  link: <path d="M10 13.5a4 4 0 006 .5l2.5-2.5a4 4 0 00-5.7-5.7L11.5 7M14 10.5a4 4 0 00-6-.5L5.5 12.5a4 4 0 005.7 5.7L12.5 17" />,
  linkcard: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M6 9.5h7M6 13h5M16 12.5h2.5M17.25 11.25v2.5" />
    </>
  ),
  embed: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  gallery: (
    <>
      <rect x="2.5" y="6.5" width="8" height="11" rx="1.4" />
      <rect x="13.5" y="6.5" width="8" height="5" rx="1.4" />
      <rect x="13.5" y="14" width="8" height="3.5" rx="1.2" />
    </>
  ),
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />,
  math: <path d="M5 5h9l-5 7 5 7H5M16 9.5l5 5M21 9.5l-5 5" />,
  toc: <path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h7" />,
  score: <path d="M3 7h18M3 10h18M3 13h18M3 16h18M3 19h18M14 5.5v9" />,
  metronome: <path d="M9 3.5h6l4 17H5zM12 18L17 7M5 16.5h14" />,
  columns: (
    <>
      <rect x="3" y="4.5" width="7.5" height="15" rx="1.5" />
      <rect x="13.5" y="4.5" width="7.5" height="15" rx="1.5" />
    </>
  ),
  steps: <path d="M4 18h4v-4h4v-4h4V6h4M4 18v-2M8 14v-2M12 10V8M16 6V4" />,
  telegram: <path d="M21.5 4.3L2.9 11.4c-.9.3-.9 1.5 0 1.8l4.6 1.5 1.7 5.2c.3.8 1.3 1 1.9.4l2.5-2.4 4.6 3.4c.7.5 1.7.1 1.9-.7l3-14.4c.2-.9-.7-1.6-1.6-1.3z" />,
  undo: <path d="M4 9h10a5.5 5.5 0 010 11H8M4 9l4-4M4 9l4 4" />,
  redo: <path d="M20 9H10a5.5 5.5 0 000 11h6M20 9l-4-4M20 9l-4 4" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  save: <path d="M5 4.5h11L19.5 8v11.5h-15zM8 4.5v5h7v-5M8 19.5v-6h8v6" />,
  publish: <path d="M12 20V5M12 5l-5 5M12 5l5 5M4.5 20h15" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  trash: <path d="M4 6.5h16M9 6.5V4h6v2.5M6.5 6.5l1 14h9l1-14M10 10.5v6.5M14 10.5v6.5" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2" />
      <path d="M15.5 5.5v-1a1 1 0 00-1-1h-10a1 1 0 00-1 1v10a1 1 0 001 1h1" />
    </>
  ),
  edit: <path d="M4 20h4l11-11-4-4L4 16zM14.5 5.5l4 4" />,
  upload: <path d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5M4.5 20h15" />,
  download: <path d="M12 4v12M12 16l-4.5-4.5M12 16l4.5-4.5M4.5 20h15" />,
  filter: <path d="M3.5 5.5h17l-6.5 8v6l-4 2v-8z" />,
  sort: <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />,
  star: <path d="M12 3.5l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.9l6.1-.8z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  tag: (
    <>
      <path d="M3.5 11.5V4.5h7l10 10-7 7z" />
      <circle cx="7.5" cy="8.5" r="1.4" />
    </>
  ),
  folder: <path d="M3.5 6.5h6l2 2.5h9v11h-17z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c1.2-4 4-6 7.5-6s6.3 2 7.5 6" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 17v-5M12.5 17V8M17 17v-7" />,
  alert: <path d="M12 4l9 16H3zM12 10v4M12 17h.01" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  arrow: <path d="M19 12H5M5 12l6-6M5 12l6 6" />,
  arrowUp: <path d="M12 19V5M12 5l-6 6M12 5l6 6" />,
  arrowDown: <path d="M12 5v14M12 19l-6-6M12 19l6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  expand: <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />,
  collapse: <path d="M9 4v5H4M15 20v-5h5M15 4v5h5M9 20v-5H4" />,
  sidebar: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M15 4.5v15" />
    </>
  ),
  words: <path d="M4 7h16M4 12h10M4 17h13M18 14l3 3-3 3" />,
  note: (
    <>
      <ellipse cx="9" cy="17.5" rx="4.5" ry="3.4" transform="rotate(-18 9 17.5)" />
      <path d="M13.2 16V4.5l6 2" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
    </>
  ),
  list: <path d="M4 6.5h16M4 12h16M4 17.5h16" />,
  play: <path d="M7 4.5l13 7.5-13 7.5z" />,
  pause: <path d="M8 4.5v15M16 4.5v15" />,
  volume: <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4zM16 9a4.5 4.5 0 010 6M18.5 6.5a8 8 0 010 11" />,
  mute: <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4zM16.5 9.5l5 5M21.5 9.5l-5 5" />,
  refresh: <path d="M20 12a8 8 0 11-2.4-5.7M20 4v4.5h-4.5" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 018 0v3M12 14.5v2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.6 3.8 5.4 3.8 8.5s-1.3 5.9-3.8 8.5c-2.5-2.6-3.8-5.4-3.8-8.5S9.5 6.1 12 3.5z" />
    </>
  ),
  sparkles: <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM18.5 15l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z" />,
};

export function Icon({
  name,
  className,
  filled,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className}
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {P[name] ?? P.info}
    </svg>
  );
}