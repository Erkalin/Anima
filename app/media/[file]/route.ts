import { readLocalUpload, storageMode } from "@/lib/db";

/**
 * Serves the local upload store. Supabase mode uses Storage URLs directly, so
 * this handler only ever runs for files written by the local backend.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  if (storageMode() === "supabase") {
    return new Response("Not found", { status: 404 });
  }

  const { file } = await params;
  const found = await readLocalUpload(decodeURIComponent(file));
  if (!found) return new Response("Not found", { status: 404 });

  const { body, mime } = found;
  const total = body.byteLength;
  const range = request.headers.get("range");

  const base: Record<string, string> = {
    "Content-Type": mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  };

  // An uploaded SVG opened directly is a same-origin document; strip its
  // scripting so a stored file can never run code against the admin session.
  if (mime === "image/svg+xml" || mime === "text/html") {
    base["Content-Security-Policy"] =
      "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox";
  }

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
      if (start <= end && start < total) {
        const slice = body.subarray(start, end + 1);
        return new Response(new Uint8Array(slice), {
          status: 206,
          headers: {
            ...base,
            "Content-Range": `bytes ${start}-${end}/${total}`,
            "Content-Length": String(slice.byteLength),
          },
        });
      }
    }
  }

  return new Response(new Uint8Array(body), {
    status: 200,
    headers: { ...base, "Content-Length": String(total) },
  });
}