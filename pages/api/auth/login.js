import bcrypt from 'bcryptjs';
import { getUserByUsername, publicUser } from '../../../utils/store';
import { signToken, setSessionCookie } from '../../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    const uname = (username || '').trim().toLowerCase();

    const user = await getUserByUsername(uname);
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Username atau password salah' });
    }

    const token = signToken({ id: user.id, username: user.username });
    setSessionCookie(res, token);

    return res.status(200).json({ success: true, user: publicUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
