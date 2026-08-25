/**
 * Standalone production server for Expo static builds.
 *
 * Routes:
 * - GET / or /manifest with expo-platform header → Expo Go manifest JSON
 * - All other requests → Expo web export from dist/ (SPA with index.html fallback)
 *
 * Zero external dependencies — uses only Node.js built-ins (http, fs, path).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const STATIC_ROOT = path.resolve(__dirname, "..", "static-build");
const WEB_DIST = path.resolve(__dirname, "..", "dist");
const basePath = (process.env.BASE_PATH || "/").replace(/\/+$/, "");

const hasWebDist = fs.existsSync(WEB_DIST);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function getMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function serveManifest(platform, res) {
  const manifestPath = path.join(STATIC_ROOT, platform, "manifest.json");

  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }

  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveWebFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(WEB_DIST, safePath);

  if (!filePath.startsWith(WEB_DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  // SPA fallback — anything that's not a real file serves index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const indexPath = path.join(WEB_DIST, "index.html");
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(fs.readFileSync(indexPath));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
    return;
  }

  res.writeHead(200, { "content-type": getMime(filePath) });
  res.end(fs.readFileSync(filePath));
}

function serveStaticFile(urlPath, res) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(STATIC_ROOT, safePath);

  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  res.writeHead(200, { "content-type": getMime(filePath) });
  res.end(fs.readFileSync(filePath));
}

const server = http.createServer((req, res) => {
  // CORS for Expo Go
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  let pathname = url.pathname;

  if (basePath && pathname.startsWith(basePath)) {
    pathname = pathname.slice(basePath.length) || "/";
  }

  // Health check endpoint for deployment probes
  if (pathname === "/status" || pathname === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Local TTS API endpoint proxy
  if (pathname === "/api/tts") {
    const text = url.searchParams.get("text") || "";
    if (!text.trim()) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "text is required" }));
      return;
    }

    const ttsUrl =
      `https://translate.googleapis.com/translate_tts` +
      `?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-CN&client=gtx&ttsspeed=0.85`;

    fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Referer: "https://translate.google.com/",
      },
    })
      .then(async (upstream) => {
        if (!upstream.ok) {
          res.writeHead(502, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "upstream TTS request failed" }));
          return;
        }
        const contentType = upstream.headers.get("content-type") || "audio/mpeg";
        const audioBuffer = await upstream.arrayBuffer();
        res.writeHead(200, {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(Buffer.from(audioBuffer));
      })
      .catch((err) => {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      });
    return;
  }

  // Expo Go manifest requests
  if (pathname === "/" || pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }
  }

  // Browser requests → serve Expo web export (dist/)
  if (hasWebDist) {
    return serveWebFile(pathname, res);
  }

  // Fallback to legacy static-build for non-web requests
  serveStaticFile(pathname, res);
});

const port = parseInt(process.env.PORT || "3000", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Web dist: ${hasWebDist ? "✓ dist/ found" : "✗ dist/ not found — browser will get 404"}`);
});
