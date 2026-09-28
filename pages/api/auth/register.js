import bcrypt from 'bcryptjs';
import { createUser, publicUser } from '../../../utils/store';
import { signToken, setSessionCookie } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password, display_name } = req.body || {};
  const uname = (username || '').trim().toLowerCase();

  if (!uname || !password || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Username & password (min 6 karakter) wajib diisi' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const name = ((display_name || '').trim() || uname).slice(0, 40);

    const user = await createUser({ username: uname, password_hash: hash, display_name: name });
    if (!user) {
      return res.status(400).json({ success: false, error: 'Username sudah dipakai' });
    }

    const token = signToken({ id: user.id, username: user.username });
    setSessionCookie(res, token);

    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
