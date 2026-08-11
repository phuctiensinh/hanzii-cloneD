import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * /api/tts?text=<chinese-text>
 *
 * Server-side proxy for Google Translate TTS.
 * Fetching from the server avoids browser CORS restrictions
 * and works in all WebView environments (Messenger, Zalo, etc.).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const text = typeof req.query.text === "string" ? req.query.text : "";

  if (!text.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  // Google Translate TTS — server-side fetch has no CORS restriction
  const ttsUrl =
    `https://translate.googleapis.com/translate_tts` +
    `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=gtx&ttsspeed=0.85`;

  try {
    const upstream = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    });

    if (!upstream.ok) {
      res.status(502).json({ error: "upstream TTS request failed", status: upstream.status });
      return;
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg";
    const audioBuffer = await upstream.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24h
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error("[api/tts] error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}
