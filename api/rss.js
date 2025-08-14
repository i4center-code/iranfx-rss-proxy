import { XMLParser } from "fast-xml-parser";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    const DEFAULT_FEED = "https://iranfxapp.ir/category/news-forex-crypto/feed/";
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || "15", 10), 50));
    const feedUrl = (req.query.url || DEFAULT_FEED).toString();

    // محدودیت امنیتی: فقط میزبان iranfxapp.ir مجازه
    try {
      const u = new URL(feedUrl);
      if (!/\.?iranfxapp\.ir$/i.test(u.hostname)) {
        res.status(400).json({ error: "Feed host not allowed" });
        return;
      }
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    // دریافت RSS (بدون کش)
    const rssRes = await fetch(feedUrl, {
      headers: {
        "accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        "cache-control": "no-cache"
      },
      cache: "no-store"
    });
    if (!rssRes.ok) {
      res.status(502).json({ error: `Upstream fetch failed: ${rssRes.status}` });
      return;
    }
    const xml = await rssRes.text();

    // پارس به JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      allowBooleanAttributes: true
    });
    const parsed = parser.parse(xml);

    // سازگاری با RSS/Atom
    const channel = parsed?.rss?.channel || parsed?.feed || {};
    let itemsRaw = channel.item || channel.entry || [];
    if (!Array.isArray(itemsRaw)) itemsRaw = itemsRaw ? [itemsRaw] : [];

    // نرمال‌سازی فیلدها
    const items = itemsRaw.map((it) => {
      const title =
        (typeof it.title === "object" ? it.title?.["#text"] : it.title) || "";
      const link =
        (typeof it.link === "object" ? (it.link?.href || it.link?.["@_href"]) : it.link) || "";
      const guid =
        (typeof it.guid === "object" ? it.guid?.["#text"] : it.guid) ||
        it.id || link || title;
      const pubDate = it.pubDate || it.published || it.updated || "";

      return { title, link, guid, pubDate };
    });

    // مرتب‌سازی و محدودسازی
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    const sliced = items.slice(0, limit);

    // کش روی CDN ورسل (اختیاری)
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");

    res.status(200).json({ items: sliced });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
