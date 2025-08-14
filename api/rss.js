const axios = require('axios');
const xml2js = require('xml2js');

module.exports = async (req, res) => {
    // اضافه کردن هدرهای CORS برای اجازه دسترسی از هر مبدأ
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const rssUrl = 'https://iranfxapp.ir/category/news-forex-crypto/feed/';

        // تنظیمات کش برای Vercel: به Vercel میگه که این پاسخ رو برای ۵ دقیقه کش کن
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

        const response = await axios.get(rssUrl);
        const xml = response.data;

        const parser = new xml2js.Parser({ explicitArray: false });
        parser.parseString(xml, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to parse RSS feed' });
            }
            const items = result.rss.channel.item.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate,
                guid: item.guid['#text']
            }));
            res.status(200).json({ items });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RSS feed' });
    }
};
