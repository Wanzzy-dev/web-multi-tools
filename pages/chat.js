import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../utils/useAuth';

const POLL_INTERVAL_MS = 2500;

export default function Chat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const lastIdRef = useRef(0);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchNewMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?after=${lastIdRef.current}`);
      if (res.status === 401) return router.replace('/login');
      const json = await res.json();
      if (json.success && json.messages.length > 0) {
        setMessages((prev) => [...prev, ...json.messages]);
        lastIdRef.current = json.messages[json.messages.length - 1].id;
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchNewMessages();
    pollRef.current = setInterval(fetchNewMessages, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [user, fetchNewMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    setError('');
    const body = { text: text.trim() };
    setText('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Gagal kirim pesan');
      } else {
        await fetchNewMessages();
      }
    } catch (err) {
      setError('Gagal kirim pesan');
    }
    setSending(false);
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Memuat...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold text-sm">← Kembali</button>
        <h1 className="font-bold text-gray-800">Chat</h1>
        <span className="text-xs text-gray-400">{user.avatar} {user.display_name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${m.user_id === user.id ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}>
              {m.user_id !== user.id && (
                <p className="text-[11px] font-bold text-blue-500 mb-0.5">{m.sender}</p>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
              <p className={`text-[10px] mt-1 ${m.user_id === user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-center text-xs text-red-500 pb-1">{error}</p>}

      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ketik pesan..."
          className="flex-1 p-3 rounded-full bg-gray-100 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-blue-600 text-white px-5 rounded-full font-bold text-sm disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
