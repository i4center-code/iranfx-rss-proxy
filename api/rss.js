const axios = require('axios');
const xml2js = require('xml2js');

module.exports = async (req, res) => {
    // تنظیمات CORS برای دسترسی امن از اپلیکیشن شما
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // پاسخ به درخواست‌های OPTIONS برای بررسی CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // تنظیمات کش در سرور Vercel
        // s-maxage=300: سرور Vercel پاسخ را برای ۵ دقیقه کش می‌کند.
        // stale-while-revalidate: اگر درخواستی بعد از ۵ دقیقه آمد، اول پاسخ قدیمی را می‌دهد و سپس در پس‌زمینه داده‌های جدید را می‌گیرد.
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
        
        // این هدرها باعث می‌شوند مرورگرها (و WebView) داده‌ها را کش نکنند.
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

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
