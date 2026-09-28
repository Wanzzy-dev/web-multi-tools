// Rate limit sederhana per user, disimpan di memory proses Node.
// Ini AMAN dipakai di Pterodactyl/VPS karena cuma ada 1 proses yang jalan terus.
// (Kalau suatu saat pindah ke banyak instance/serverless, ini perlu diganti
// pakai Redis atau storage bersama, karena tiap instance punya memory sendiri.)
const hits = new Map();

export function isRateLimited(userId, maxPerWindow = 8, windowMs = 10000) {
  const now = Date.now();
  const arr = (hits.get(userId) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(userId, arr);
  return arr.length > maxPerWindow;
}
