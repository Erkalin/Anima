export function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
      />
    </svg>
  );
}

export function Staff() {
  return (
    <svg className="staff" viewBox="0 0 320 120" aria-hidden="true" focusable="false">
      {[20, 40, 60, 80, 100].map((y) => (
        <line key={y} x1="2" y1={y} x2="318" y2={y} />
      ))}
      <ellipse
        className="note-head"
        cx="150"
        cy="62"
        rx="10"
        ry="7.5"
        transform="rotate(-22 150 62)"
      />
      <line className="note-stem" x1="159" y1="58" x2="159" y2="14" />
    </svg>
  );
}

function Note({ x, y, up = true }: { x: number; y: number; up?: boolean }) {
  const stemX = up ? x + 6 : x - 6;
  return (
    <g className="note">
      <ellipse cx={x} cy={y} rx="6.5" ry="4.8" transform={`rotate(-20 ${x} ${y})`} />
      <line x1={stemX} y1={y} x2={stemX} y2={up ? y - 34 : y + 34} />
    </g>
  );
}

// Large sheet-music system used as the hero's visual anchor.
export function Score() {
  const staves = [0, 1, 2, 3];
  const lines = [0, 1, 2, 3, 4];
  return (
    <svg className="score" viewBox="0 0 520 560" aria-hidden="true" focusable="false">
      {staves.map((staff) => (
        <g key={staff} className="stave" transform={`translate(0 ${staff * 150})`}>
          {lines.map((line) => (
            <line key={line} x1="0" y1={line * 18} x2="520" y2={line * 18} />
          ))}
          <line className="bar" x1="150" y1="0" x2="150" y2="72" />
          <line className="bar" x1="345" y1="0" x2="345" y2="72" />
        </g>
      ))}
      <Note x={72} y={36} />
      <Note x={210} y={27} />
      <Note x={262} y={54} />
      <Note x={98} y={186} />
      <Note x={382} y={195} />
      <Note x={168} y={345} />
      <Note x={300} y={354} />
      <Note x={420} y={468} />
    </svg>
  );
}

// One shared gradient definition for every keyboard on the site.
export function SvgDefs() {
  return (
    <svg
      className="svg-defs"
      width="0"
      height="0"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="piano-key-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6ecda" />
          <stop offset="0.65" stopColor="#d9c8ae" />
          <stop offset="1" stopColor="#b9a78c" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// A cropped keyboard reads as "piano" at a glance and stays elegant as line art.
export function PianoKeys() {
  const whites = Array.from({ length: 13 }, (_, i) => i);
  const blacks = [0, 1, 3, 4, 5, 7, 8, 10, 11];
  return (
    <svg className="art-piano" viewBox="0 0 520 250" aria-hidden="true" focusable="false">
      {whites.map((i) => (
        <rect
          key={i}
          className="pk-white"
          x={8 + i * 38}
          y="34"
          width="38"
          height="190"
          rx="3"
        />
      ))}
      {blacks.map((i) => (
        <rect
          key={i}
          className="pk-black"
          x={8 + (i + 1) * 38 - 11}
          y="34"
          width="22"
          height="118"
          rx="2"
        />
      ))}
      <line className="pk-rail" x1="4" y1="28" x2="512" y2="28" />
    </svg>
  );
}

export function ViolinArt() {
  return (
    <svg className="art-violin" viewBox="0 0 220 620" aria-hidden="true" focusable="false">
      <path d="M110 178 C82 180 64 206 60 238 C56 272 70 296 84 316 C68 334 52 366 48 404 C42 460 70 524 110 542 C150 524 178 460 172 404 C168 366 152 334 136 316 C150 296 164 272 160 238 C156 206 138 180 110 178 Z" />
      <path d="M106 190 L114 190 L113 96 L107 96 Z" />
      <rect x="99" y="66" width="22" height="32" rx="4" />
      <circle cx="110" cy="50" r="17" />
      <circle cx="110" cy="50" r="6" />
      <line x1="88" y1="72" x2="96" y2="72" />
      <line x1="124" y1="72" x2="132" y2="72" />
      <line x1="88" y1="84" x2="96" y2="84" />
      <line x1="124" y1="84" x2="132" y2="84" />
      {[101, 107, 113, 119].map((x) => (
        <line key={x} className="violin-string" x1={x} y1="72" x2={x} y2="500" />
      ))}
      <path d="M92 432 Q110 426 128 432" />
      <path d="M100 470 L120 470 L115 522 L105 522 Z" />
      <path d="M80 362 C90 372 72 380 80 394 C88 408 70 414 78 430" />
      <path d="M140 362 C130 372 148 380 140 394 C132 408 150 414 142 430" />
    </svg>
  );
}

// Pendulum swing is pure CSS, so it stays seek-safe and reduced-motion friendly.
export function Metronome() {
  return (
    <svg className="art-metro" viewBox="0 0 200 260" aria-hidden="true" focusable="false">
      <path className="metro-body" d="M62 66 L138 66 L166 236 L34 236 Z" />
      <line className="metro-base" x1="24" y1="240" x2="176" y2="240" />
      <path className="metro-scale" d="M74 100 L126 100 M70 124 L130 124 M66 148 L134 148" />
      <g className="metro-arm">
        <line x1="100" y1="230" x2="118" y2="90" />
        <rect x="107" y="108" width="16" height="30" rx="3" />
      </g>
      <circle className="metro-pivot" cx="100" cy="230" r="3" />
    </svg>
  );
}

export function Equalizer() {
  return (
    <div className="eq" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ animationDelay: `${i * 110}ms` }} />
      ))}
    </div>
  );
}
