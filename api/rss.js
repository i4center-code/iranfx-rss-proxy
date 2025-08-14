const axios = require('axios');
const xml2js = require('xml2js');

module.exports = async (req, res) => {
    try {
        const rssUrl = 'https://iranfxapp.ir/category/news-forex-crypto/feed/';
        
        const response = await axios.get(rssUrl, {
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
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
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.status(200).json({ items });
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RSS feed' });
    }
};
