import { NontonAnimeIDScraper } from '../../utils/nontonanime';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { action, query, urlOrSlug } = req.body;
  const scraper = new NontonAnimeIDScraper();

  try {
    switch (action) {
      case 'home': {
        const homeData = await scraper.getHome();
        return res.status(200).json({ success: true, data: homeData });
      }
      case 'search': {
        const searchResults = await scraper.searchAnime(query);
        return res.status(200).json({ success: true, data: searchResults });
      }
      case 'detail': {
        const detailData = await scraper.getAnimeDetail(urlOrSlug);
        return res.status(200).json({ success: true, data: detailData });
      }
      case 'streaming': {
        const streamData = await scraper.getStreamingDetail(urlOrSlug);
        return res.status(200).json({ success: true, data: streamData });
      }
      case 'get_video': {
        const { postId, nume, serverName, nonce, ajaxUrl } = req.body;
        const iframeSrc = await scraper.getVideoIframe(postId, nume, serverName, nonce, ajaxUrl);
        return res.status(200).json({ success: true, iframe: iframeSrc });
      }
      default:
        return res.status(400).json({ success: false, error: 'Aksi tidak valid' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const config = { maxDuration: 30 };
