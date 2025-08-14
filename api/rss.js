const axios = require('axios');
const xml2js = require('xml2js');

// یک حافظهٔ ساده برای کش کردن لیست استوری‌ها
let cachedItems = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 60 ثانیه

module.exports = async (req, res) => {
    // تنظیمات CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const now = Date.now();

        // اگر کش هنوز معتبر است، از آن استفاده کن
        if (cachedItems && (now - cacheTimestamp < CACHE_DURATION)) {
            return res.status(200).json({ items: cachedItems });
        }

        const rssUrl = 'https://iranfxapp.ir/category/news-forex-crypto/feed/';
        const response = await axios.get(rssUrl);
        const xml = response.data;

        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(xml, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to parse RSS feed' });
            }

            const items = result.rss.channel.item.map(item => ({
                title: item.title,
                link: item.link,  // لینک مستقیم خبر
                pubDate: item.pubDate,
                guid: item.guid['#text']
            }));

            // ذخیره در کش
            cachedItems = items;
            cacheTimestamp = Date.now();

            res.status(200).json({ items });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RSS feed' });
    }
};
