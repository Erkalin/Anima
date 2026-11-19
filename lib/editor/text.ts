export type Snapshot = { value: string; start: number; end: number };

export type LineKind =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "ul"
  | "ol"
  | "task"
  | "quote";

const PREFIX = /^([ \t]*)(?:#{1,6}[ \t]+|[-*+][ \t]+\[[ xX]\][ \t]+|[-*+][ \t]+|\d+[.)][ \t]+|>[ \t]?)/;

function split(line: string) {
  const m = PREFIX.exec(line);
  if (!m) return { indent: "", rest: line, kind: "p" as LineKind };
  const indent = m[1];
  const token = m[0].slice(indent.length);
  const rest = line.slice(m[0].length);
  let kind: LineKind = "p";
  if (/^#{1,6}/.test(token)) kind = `h${token.trim().length}` as LineKind;
  else if (/\[[ xX]\]/.test(token)) kind = "task";
  else if (/^\d/.test(token)) kind = "ol";
  else if (/^>/.test(token)) kind = "quote";
  else kind = "ul";
  return { indent, rest, kind };
}

function region(value: string, start: number, end: number) {
  const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  let to = value.indexOf("\n", end);
  if (to === -1) to = value.length;
  return { from, to, lines: value.slice(from, to).split("\n") };
}

export function applyLineKind(
  value: string,
  start: number,
  end: number,
  kind: LineKind,
): Snapshot {
  const { from, to, lines } = region(value, start, end);
  const parsed = lines.map(split);
  const nonEmpty = parsed.filter((p) => p.rest.trim().length > 0);
  const allSame =
    nonEmpty.length > 0 && nonEmpty.every((p) => p.kind === kind);
  const target: LineKind = allSame ? "p" : kind;

  let n = 0;
  const out = parsed.map((p) => {
    if (p.rest.trim().length === 0 && lines.length > 1) return p.indent + p.rest;
    n += 1;
    switch (target) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
        return `${p.indent}${"#".repeat(Number(target[1]))} ${p.rest}`;
      case "ul":
        return `${p.indent}- ${p.rest}`;
      case "ol":
        return `${p.indent}${n}. ${p.rest}`;
      case "task":
        return `${p.indent}- [ ] ${p.rest}`;
      case "quote":
        return `${p.indent}> ${p.rest}`;
      default:
        return p.indent + p.rest;
    }
  });

  const next = out.join("\n");
  return {
    value: value.slice(0, from) + next + value.slice(to),
    start: from,
    end: from + next.length,
  };
}

export function wrapInline(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string,
): Snapshot {
  const selected = value.slice(start, end);

  if (
    selected.length > 0 &&
    value.slice(start - before.length, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    return {
      value:
        value.slice(0, start - before.length) +
        selected +
        value.slice(end + after.length),
      start: start - before.length,
      end: end - before.length,
    };
  }

  if (
    selected.startsWith(before) &&
    selected.endsWith(after) &&
    selected.length >= before.length + after.length
  ) {
    const inner = selected.slice(before.length, selected.length - after.length);
    return {
      value: value.slice(0, start) + inner + value.slice(end),
      start,
      end: start + inner.length,
    };
  }

  const body = selected || placeholder;
  return {
    value: value.slice(0, start) + before + body + after + value.slice(end),
    start: start + before.length,
    end: start + before.length + body.length,
  };
}

/** Places a block on its own paragraph, keeping one blank line on each side. */
export function insertBlock(
  value: string,
  start: number,
  end: number,
  text: string,
  select?: [number, number],
): Snapshot {
  const head = value.slice(0, start);
  const tail = value.slice(end);

  let lead = "";
  if (head.length > 0) {
    if (!head.endsWith("\n\n")) lead = head.endsWith("\n") ? "\n" : "\n\n";
  }
  let trail = "";
  if (tail.length > 0 && !tail.startsWith("\n")) trail = "\n\n";
  else if (tail.startsWith("\n") && !tail.startsWith("\n\n")) trail = "\n";

  const body = lead + text + trail;
  const base = start + lead.length;
  const [a, b] = select ?? [text.length, text.length];
  return {
    value: head + body + tail,
    start: base + a,
    end: base + b,
  };
}

export function replaceRange(
  value: string,
  start: number,
  end: number,
  text: string,
  select?: [number, number],
): Snapshot {
  const [a, b] = select ?? [text.length, text.length];
  return {
    value: value.slice(0, start) + text + value.slice(end),
    start: start + a,
    end: start + b,
  };
}

export function lineAt(value: string, pos: number) {
  const from = value.lastIndexOf("\n", Math.max(0, pos - 1)) + 1;
  let to = value.indexOf("\n", pos);
  if (to === -1) to = value.length;
  return { from, to, text: value.slice(from, to) };
}

/** Continues lists and quotes when Enter is pressed; exits on an empty item. */
export function continueList(
  value: string,
  pos: number,
): Snapshot | null {
  const { from, text } = lineAt(value, pos);
  const m = /^([ \t]*)([-*+][ \t]+\[[ xX]\][ \t]+|[-*+][ \t]+|(\d+)([.)])[ \t]+|>[ \t]?)(.*)$/.exec(
    text,
  );
  if (!m) return null;
  const [, indent, token, num, , rest] = m;
  if (rest.trim().length === 0) {
    return {
      value: value.slice(0, from) + value.slice(pos),
      start: from,
      end: from,
    };
  }
  let next = token;
  if (num) next = `${Number(num) + 1}${m[4]} `;
  else if (/\[[xX]\]/.test(token)) next = token.replace(/\[[xX]\]/, "[ ]");
  const insert = `\n${indent}${next}`;
  return {
    value: value.slice(0, pos) + insert + value.slice(pos),
    start: pos + insert.length,
    end: pos + insert.length,
  };
}

export function indentSelection(
  value: string,
  start: number,
  end: number,
  outdent: boolean,
): Snapshot {
  const { from, to, lines } = region(value, start, end);
  const out = lines.map((l) =>
    outdent ? l.replace(/^[ \t]{1,2}/, "") : l.length ? `  ${l}` : l,
  );
  const next = out.join("\n");
  return {
    value: value.slice(0, from) + next + value.slice(to),
    start: from,
    end: from + next.length,
  };
}

export function moveLines(
  value: string,
  start: number,
  end: number,
  dir: -1 | 1,
): Snapshot | null {
  const { from, to } = region(value, start, end);
  const block = value.slice(from, to);
  if (dir === -1) {
    if (from === 0) return null;
    const prevFrom = value.lastIndexOf("\n", from - 2) + 1;
    const prev = value.slice(prevFrom, from - 1);
    return {
      value:
        value.slice(0, prevFrom) +
        block +
        "\n" +
        prev +
        value.slice(to),
      start: prevFrom,
      end: prevFrom + block.length,
    };
  }
  if (to >= value.length) return null;
  const nextTo = value.indexOf("\n", to + 1);
  const stop = nextTo === -1 ? value.length : nextTo;
  const next = value.slice(to + 1, stop);
  const offset = next.length + 1;
  return {
    value:
      value.slice(0, from) +
      next +
      "\n" +
      block +
      value.slice(stop),
    start: from + offset,
    end: from + offset + block.length,
  };
}

export type Match = { start: number; end: number };

export function findAll(
  value: string,
  query: string,
  caseSensitive: boolean,
): Match[] {
  if (!query) return [];
  const hay = caseSensitive ? value : value.toLowerCase();
  const needle = caseSensitive ? query : query.toLowerCase();
  const out: Match[] = [];
  let i = hay.indexOf(needle);
  while (i !== -1 && out.length < 5000) {
    out.push({ start: i, end: i + needle.length });
    i = hay.indexOf(needle, i + needle.length);
  }
  return out;
}