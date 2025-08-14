import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const rssUrl = "https://iranfxapp.ir/category/news-forex-crypto/feed/";
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to fetch RSS feed" });
    }

    const data = await response.json();

    // فقط 15 خبر آخر
    const items = (data.items || []).sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    ).slice(0, 15);

    res.status(200).json({ items });
  } catch (error) {
    console.error("RSS fetch error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
