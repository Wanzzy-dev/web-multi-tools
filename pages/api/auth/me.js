import { getUserById, publicUser } from '../../../utils/store';
import { getUserFromReq } from '../../../utils/auth';

export default async function handler(req, res) {
  const session = getUserFromReq(req);
  if (!session) return res.status(401).json({ success: false, error: 'Belum login' });

  try {
    const user = await getUserById(session.id);
    if (!user) return res.status(401).json({ success: false, error: 'User tidak ditemukan' });
    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
