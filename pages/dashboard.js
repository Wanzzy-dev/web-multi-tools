import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../utils/useAuth';

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 inline-block ml-1" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-7.5 1.6 1.4-8 9.1z" /></svg>
);

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [logs, setLogs] = useState([]);

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const generateOneAccount = async () => {
    try {
      setStatus('1/4: Membuat Tempmail...');
      const req1 = await fetch('/api/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'create_email' }) });
      const { email } = await req1.json();

      setStatus(`2/4: Kirim link ke ${email}...`);
      await fetch('/api/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'send_link', email }) });

      setStatus('3/4: Nunggu inbox (Maks 1 mnt)...');
      let link = null;
      for(let i=0; i < 20; i++) {
        await delay(3000);
        const req3 = await fetch('/api/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'check_inbox', email }) });
        const res3 = await req3.json();
        if (res3.magicLink) { link = res3.magicLink; break; }
      }
      if (!link) throw new Error("Link ga masuk-masuk (Timeout)");

      setStatus('4/4: Eksekusi Lisensi...');
      const req4 = await fetch('/api/generate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ action: 'verify_link', email, link }) });
      const res4 = await req4.json();

      if (!res4.success) throw new Error(res4.error);
      return { success: true, email: email, message: res4.message };

    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleAutoClick = async () => {
    setLoading(true); setLogs([]);
    const res = await generateOneAccount();
    setLogs([res]);
    setLoading(false); setStatus('');
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">

        <div className="border-b pb-4 mb-6 flex justify-between items-center">
          <div onClick={() => router.push('/profile')} className="cursor-pointer flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
              {user.avatar}
            </div>
            <div>
              <h1 className="text-lg font-bold flex items-center text-gray-800">
                {user.display_name}
                {user.is_premium && <VerifiedBadge />}
              </h1>
              <p className="text-xs text-green-600 font-medium">Dashboard Web Premium</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/ai')} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">
              🤖 AI
            </button>
            <button onClick={() => router.push('/chat')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">
              💬 Chat
            </button>
            <button onClick={() => router.push('/anime')} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md">
              🍿 Anime
            </button>
          </div>
        </div>

        <button onClick={handleAutoClick} disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow disabled:opacity-50">
          {loading ? 'Sistem Sedang Bekerja...' : 'Generate 1 Akun Sekarang (Auto)'}
        </button>

        {loading && (
          <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 font-mono text-sm rounded border border-yellow-200">
            ⏳ Status API: {status}
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-6 space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`p-4 border-l-4 rounded bg-gray-50 ${log.success ? 'border-green-500' : 'border-red-500'}`}>
                {log.success ? (
                  <>
                    <p className="font-bold text-green-700">✅ Sukses</p>
                    <p className="text-gray-800 font-mono mt-1">{log.email}</p>
                    <p className="text-xs text-gray-500">{log.message}</p>
                  </>
                ) : (
                  <p className="text-red-600 font-bold">❌ Gagal: {log.error}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
