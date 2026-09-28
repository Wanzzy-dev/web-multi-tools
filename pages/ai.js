import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import useAuth from '../utils/useAuth';

const VerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-500 inline-block ml-1" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-7.5 1.6 1.4-8 9.1z" /></svg>
);

export default function AiChat() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetch('/api/ai')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setMessages(json.messages);
        setHistoryLoaded(true);
      });
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || thinking) return;
    const prompt = text.trim();
    setText('');
    setError('');
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', content: prompt, created_at: new Date().toISOString() }]);
    setThinking(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'AI gagal merespons');
      } else {
        setMessages((prev) => [...prev, json.message]);
      }
    } catch (err) {
      setError('Gagal menghubungi AI');
    }
    setThinking(false);
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Memuat...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push('/dashboard')} className="text-blue-600 font-bold text-sm">← Kembali</button>
        <h1 className="font-bold text-gray-800 flex items-center gap-1">🤖 Asisten AI<VerifiedBadge /></h1>
        <span className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {historyLoaded && messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-10">
            Halo {user.display_name}! Tanya apa aja ke gw 👋
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-sm shadow-sm text-gray-400 text-sm italic">
              Lagi mikir...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-center text-xs text-red-500 pb-1">{error}</p>}

      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tanya sesuatu..."
          className="flex-1 p-3 rounded-full bg-gray-100 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={thinking || !text.trim()}
          className="bg-blue-600 text-white px-5 rounded-full font-bold text-sm disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
    </div>
  );
}
