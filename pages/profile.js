import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../utils/useAuth';

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 inline-block ml-1" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-7.5 1.6 1.4-8 9.1z" /></svg>
);

const AVATAR_OPTIONS = ['😀', '😎', '🦊', '🐱', '🐼', '🐸', '🤖', '👾', '🔥', '⚡'];

export default function Profile() {
  const router = useRouter();
  const { user, setUser, loading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('😀');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name);
      setAvatar(user.avatar);
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName, avatar }),
    });
    const json = await res.json();
    if (json.success) {
      setUser(json.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold text-sm mb-4">← Kembali</button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mb-2">
            {avatar}
          </div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center">
            {user.display_name}
            {user.is_premium && <VerifiedBadge />}
          </h1>
          <p className="text-sm text-gray-400">@{user.username}</p>
        </div>

        <form onSubmit={handleSave}>
          <label className="text-xs font-bold text-gray-500 mb-1 block">Nama Tampilan</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-3 mb-4 border rounded bg-gray-50 outline-none focus:border-blue-500"
          />

          <label className="text-xs font-bold text-gray-500 mb-2 block">Pilih Avatar</label>
          <div className="grid grid-cols-5 gap-2 mb-6">
            {AVATAR_OPTIONS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-2xl p-2 rounded-lg border-2 ${avatar === a ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-50'}`}
              >
                {a}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50 mb-3"
          >
            {saving ? 'Menyimpan...' : saved ? '✅ Tersimpan' : 'Simpan Perubahan'}
          </button>
        </form>

        {!user.is_premium && (
          <p className="text-xs text-center text-gray-400 mb-3">
            Badge premium cuma bisa diaktifin manual dari admin/database saat ini.
          </p>
        )}

        <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 p-3 rounded font-bold hover:bg-red-100 transition">
          Logout
        </button>
      </div>
    </div>
  );
}
