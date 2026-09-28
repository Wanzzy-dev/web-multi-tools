// Penyimpanan data buat Vercel.
// Vercel itu serverless: gak ada disk persisten, jadi SQLite (better-sqlite3) gak bisa dipakai.
//  - Kalau Upstash Redis / Vercel KV udah terhubung (env otomatis keisi) -> data permanen.
//  - Kalau belum -> pakai memori sementara (jalan, tapi data bisa hilang sewaktu-waktu).
const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const persistent = Boolean(REST_URL && REST_TOKEN);

const mem = globalThis.__wanzzyMem || (globalThis.__wanzzyMem = { kv: new Map(), lists: new Map(), seq: new Map() });

async function redis(args) {
  const r = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

async function nextId(name) {
  if (persistent) return Number(await redis(['INCR', `seq:${name}`]));
  const n = (mem.seq.get(name) || 0) + 1;
  mem.seq.set(name, n);
  return n;
}

async function kvGet(key) {
  if (persistent) return redis(['GET', key]);
  return mem.kv.has(key) ? mem.kv.get(key) : null;
}

async function kvSet(key, value) {
  if (persistent) return redis(['SET', key, value]);
  mem.kv.set(key, value);
}

async function kvSetIfAbsent(key, value) {
  if (persistent) return Boolean(await redis(['SETNX', key, value]));
  if (mem.kv.has(key)) return false;
  mem.kv.set(key, value);
  return true;
}

async function listPush(key, value, max) {
  if (persistent) {
    await redis(['RPUSH', key, value]);
    await redis(['LTRIM', key, String(-max), '-1']);
    return;
  }
  const arr = mem.lists.get(key) || [];
  arr.push(value);
  if (arr.length > max) arr.splice(0, arr.length - max);
  mem.lists.set(key, arr);
}

async function listLast(key, count) {
  if (persistent) return (await redis(['LRANGE', key, String(-count), '-1'])) || [];
  return (mem.lists.get(key) || []).slice(-count);
}

const parse = (s) => (s ? JSON.parse(s) : null);
const now = () => new Date().toISOString();

// ---------- users ----------
export async function getUserById(id) {
  return parse(await kvGet(`user:${id}`));
}

export async function getUserByUsername(username) {
  const id = await kvGet(`uname:${username}`);
  return id ? getUserById(Number(id)) : null;
}

// return null kalau username sudah dipakai
export async function createUser({ username, password_hash, display_name }) {
  const id = await nextId('user');
  const claimed = await kvSetIfAbsent(`uname:${username}`, String(id));
  if (!claimed) return null;
  const user = { id, username, password_hash, display_name, avatar: '😀', is_premium: 0, created_at: now() };
  await kvSet(`user:${id}`, JSON.stringify(user));
  return user;
}

export async function updateUser(id, patch) {
  const user = await getUserById(id);
  if (!user) return null;
  const next = { ...user, ...patch };
  await kvSet(`user:${id}`, JSON.stringify(next));
  return next;
}

// ---------- chat global ----------
export async function addChatMessage({ user_id, sender, text }) {
  const msg = { id: await nextId('chat'), user_id, sender, text, created_at: now() };
  await listPush('chat', JSON.stringify(msg), 500);
  return msg;
}

export async function getChatAfter(afterId = 0, limit = 100) {
  const rows = (await listLast('chat', limit)).map((s) => JSON.parse(s));
  return rows.filter((m) => m.id > afterId);
}

// ---------- chat AI (per user) ----------
export async function addAiMessage(user_id, role, content) {
  const msg = { id: await nextId('ai'), role, content, created_at: now() };
  await listPush(`ai:${user_id}`, JSON.stringify(msg), 200);
  return msg;
}

export async function getAiMessages(user_id, limit = 200) {
  return (await listLast(`ai:${user_id}`, limit)).map((s) => JSON.parse(s));
}

// Versi aman buat dikirim ke client (tanpa password_hash)
export function publicUser(u) {
  return { id: u.id, username: u.username, display_name: u.display_name, avatar: u.avatar, is_premium: !!u.is_premium };
}
