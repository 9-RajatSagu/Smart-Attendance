// Vercel serverless proxy: browser -> /api/gas -> Google Apps Script (/exec).
// Set the GAS_URL environment variable in Vercel to your Apps Script /exec URL.
module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  const base = (process.env.GAS_URL || "").trim().replace(/^["']|["']$/g, "");
  if (!base) return res.status(500).json({ error: "GAS_URL is not set in Vercel Environment Variables." });
  try {
    const i = req.url.indexOf("?");
    const qs = i > -1 ? req.url.slice(i) : "";
    const opt = { method: req.method === "POST" ? "POST" : "GET", redirect: "follow" };
    if (opt.method === "POST") {
      opt.headers = { "Content-Type": "text/plain;charset=utf-8" };
      opt.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    }
    const r = await fetch(base + qs, opt);
    const text = await r.text();
    try { JSON.parse(text); } catch (e) { const u = new URL(r.url);
      return res.status(502).json({ error: "bad_backend", status: r.status, host: u.host, path: u.pathname.slice(0, 40), preview: text.replace(/\s+/g, " ").slice(0, 160) }); }
    res.setHeader("Content-Type", "application/json");
    return res.status(200).send(text);
  } catch (e) {
    return res.status(502).json({ error: "unreachable" });
  }
};
