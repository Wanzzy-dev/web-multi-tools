import { getUserById, addChatMessage, getChatAfter } from '../../utils/store';
import { getUserFromReq } from '../../utils/auth';
import { isRateLimited } from '../../utils/rateLimit';
import { censorText } from '../../utils/badwords';

export default async function handler(req, res) {
  try {
    const session = getUserFromReq(req);
    if (!session) return res.status(401).json({ success: false, error: 'Belum login' });

    if (req.method === 'GET') {
      const afterId = parseInt(req.query.after || '0', 10) || 0;
      const messages = await getChatAfter(afterId, 100);
      return res.status(200).json({ success: true, messages });
    }

    if (req.method === 'POST') {
      if (isRateLimited(session.id)) {
        return res.status(429).json({ success: false, error: 'Kecepetan ngirim pesan, tunggu sebentar ya' });
      }

      const { text } = req.body || {};
      if (!text || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Pesan gak boleh kosong' });
      }

      // Sender diambil dari session server, BUKAN dari input client -> gak bisa dipalsuin.
      const user = await getUserById(session.id);
      if (!user) return res.status(401).json({ success: false, error: 'User tidak ditemukan' });

      const clean = censorText(text.trim().slice(0, 2000));
      const message = await addChatMessage({ user_id: session.id, sender: user.display_name, text: clean });

      return res.status(200).json({ success: true, message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
