import jwt from 'jsonwebtoken';

// PENTING: ganti JWT_SECRET lewat environment variable di Pterodactyl
// (Startup > Variables atau file .env). Kalau gak diset, dia jatoh ke
// nilai default yang GAK aman buat production.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  'ganti-secret-ini-sebelum-production';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Ambil user (id, username) dari cookie "session" di request.
// req.cookies sudah otomatis di-parse oleh Next.js di API routes.
export function getUserFromReq(req) {
  const token = req.cookies?.session;
  if (!token) return null;
  return verifyToken(token);
}

export function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `session=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax`
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}
