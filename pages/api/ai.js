import { addAiMessage, getAiMessages } from '../../utils/store';
import { getUserFromReq } from '../../utils/auth';
import { isRateLimited } from '../../utils/rateLimit';
import { chatWithAI } from '../../utils/rewind-ai';

// Balasan AI di-stream, jadi kasih waktu lebih lama dari default Vercel.
export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const session = getUserFromReq(req);
  if (!session) return res.status(401).json({ success: false, error: 'Belum login' });

  try {
    if (req.method === 'GET') {
      const messages = await getAiMessages(session.id, 200);
      return res.status(200).json({ success: true, messages });
    }

    if (req.method === 'POST') {
      if (isRateLimited(`ai_${session.id}`, 6, 15000)) {
        return res.status(429).json({ success: false, error: 'Pelan-pelan, tunggu sebentar sebelum kirim lagi' });
      }

      const { prompt } = req.body || {};
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ success: false, error: 'Pesan gak boleh kosong' });
      }
      const clean = prompt.trim().slice(0, 2000);

      await addAiMessage(session.id, 'user', clean);

      const result = await chatWithAI(clean);
      if (!result.success) {
        return res.status(502).json({ success: false, error: result.mess || 'AI gagal merespons' });
      }

      const message = await addAiMessage(session.id, 'assistant', result.response || '(kosong)');
      return res.status(200).json({ success: true, message });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
