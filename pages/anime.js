import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MdHome, MdBookmark, MdExplore, MdLiveTv, MdPerson, MdSearch, MdFilterList, MdMoreVert, MdCast } from 'react-icons/md';
import useAuth from '../utils/useAuth';

export default function AnimeApp() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState('home');
  const [activeTab, setActiveTab] = useState('SEMUA ANIME');
  const [activeNav, setActiveNav] = useState('Jelajahi');

  const [homeData, setHomeData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHome();
  }, []);

  const fetchHome = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'home' })
      });
      const json = await res.json();
      if (json.success) setHomeData(json.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openDetail = async (url) => {
    setLoading(true);
    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detail', urlOrSlug: url })
      });
      const json = await res.json();
      if (json.success) {
        setDetailData(json.data);
        setView('detail');
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const openPlayer = async (url) => {
    setLoading(true);
    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'streaming', urlOrSlug: url })
      });
      const json = await res.json();

      if (json.success && json.data) {
        setPlayerData(json.data);
        const server = json.data.video_servers?.[0];
        if (server) {
          const vidRes = await fetch('/api/anime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_video', postId: server.post_id, nume: server.nume, serverName: server.server_name, nonce: json.data.nonce, ajaxUrl: json.data.ajax_url })
          });
          const vidJson = await vidRes.json();
          if (vidJson.success) setVideoUrl(vidJson.iframe);
        }
        setView('player');
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  if (authLoading || !user) {
    return <div className="flex h-screen items-center justify-center bg-black text-gray-400">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pb-16">
      {loading && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/80 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500"></div>
        </div>
      )}

      {view === 'home' && (
        <div className="animate-fade-in">
          <div className="sticky top-0 z-40 bg-black pt-4 pb-2 px-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Jelajahi</h1>
            <div className="flex space-x-4 text-2xl">
              <MdCast className="cursor-pointer hover:text-orange-500" />
              <MdSearch className="cursor-pointer hover:text-orange-500" />
            </div>
          </div>

          <div className="sticky top-[52px] z-40 bg-black border-b border-gray-800 flex overflow-x-auto hide-scrollbar text-xs font-bold text-gray-400 px-4">
            {['SEMUA ANIME', 'SIMULCAST', 'GENRE ANIME', 'MUSIK'].map((tab) => (
              <div key={tab} onClick={() => setActiveTab(tab)} className={`py-3 mr-6 whitespace-nowrap cursor-pointer transition-colors ${activeTab === tab ? 'text-white border-b-2 border-orange-500' : 'hover:text-gray-200'}`}>
                {tab}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center px-4 py-3 text-sm font-bold text-gray-300">
            <span>Populer</span>
            <MdFilterList className="text-xl text-cyan-500" />
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            {homeData?.episode_terbaru?.map((anime, idx) => (
              <div key={idx} onClick={() => openDetail(anime.link)} className="cursor-pointer group">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={anime.image} alt={anime.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="mt-2 flex justify-between items-start">
                  <div className="pr-2">
                    <h3 className="text-sm font-bold line-clamp-1 leading-tight">{anime.title}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Sub Indo | Takarir</p>
                  </div>
                  <MdMoreVert className="text-gray-400 text-lg flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(view === 'detail' || view === 'player') && (
        <div className="animate-fade-in bg-gray-950 min-h-screen">
          <div className="sticky top-0 z-50 bg-black/90 backdrop-blur p-4 flex items-center">
            <button onClick={() => setView(view === 'player' ? 'detail' : 'home')} className="text-orange-500 font-bold mr-4">← Kembali</button>
            <h1 className="font-bold truncate text-sm">{view === 'detail' ? detailData?.title : playerData?.title}</h1>
          </div>

          {view === 'player' && playerData && (
            <div className="w-full aspect-video bg-black sticky top-[56px] z-40">
              {videoUrl ? <iframe src={videoUrl} allowFullScreen className="w-full h-full border-none"></iframe> : <div className="text-center py-20 text-gray-500">Menyiapkan Video...</div>}
            </div>
          )}

          {view === 'detail' && detailData && (
            <div className="p-4">
              <div className="flex gap-4 mb-6">
                <img src={detailData.poster} className="w-28 h-40 object-cover rounded shadow-lg" />
                <div>
                  <h1 className="text-xl font-bold mb-1">{detailData.title}</h1>
                  <p className="text-xs text-green-400 font-bold mb-2">{detailData.score ? `⭐ ${detailData.score}` : 'Baru'}</p>
                  <div className="flex flex-wrap gap-1">
                    {detailData.genres?.slice(0,3).map((g, i) => <span key={i} className="bg-gray-800 text-[10px] px-2 py-1 rounded">{g.name}</span>)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">{detailData.synopsis}</p>
            </div>
          )}

          <div className="p-4">
            <h2 className="text-lg font-bold mb-4 border-l-4 border-orange-500 pl-2">Semua Episode</h2>
            <div className="space-y-2">
              {detailData?.episodes?.map((ep, idx) => (
                <div key={idx} onClick={() => openPlayer(ep.link)} className={`p-3 rounded flex items-center justify-between cursor-pointer ${playerData?.title?.includes(ep.title) ? 'bg-orange-900/30 border border-orange-500' : 'bg-gray-900 hover:bg-gray-800'}`}>
                  <span className="text-sm font-bold">{ep.title}</span>
                  {playerData?.title?.includes(ep.title) ? <span className="text-xs text-orange-500">Diputar</span> : <span className="text-lg text-gray-500">▶</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'home' && (
        <div className="fixed bottom-0 w-full bg-[#121212] border-t border-gray-800 flex justify-around items-center py-2 z-50 pb-safe">
          <div onClick={() => setActiveNav('Beranda')} className={`flex flex-col items-center cursor-pointer ${activeNav === 'Beranda' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <MdHome className="text-2xl mb-1" />
            <span className="text-[10px] font-bold">Beranda</span>
          </div>
          <div onClick={() => setActiveNav('Daftarku')} className={`flex flex-col items-center cursor-pointer ${activeNav === 'Daftarku' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <MdBookmark className="text-2xl mb-1" />
            <span className="text-[10px] font-bold">Daftarku</span>
          </div>
          <div onClick={() => setActiveNav('Jelajahi')} className={`flex flex-col items-center cursor-pointer ${activeNav === 'Jelajahi' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <MdExplore className="text-2xl mb-1" />
            <span className="text-[10px] font-bold">Jelajahi</span>
          </div>
          <div onClick={() => setActiveNav('Simulcast')} className={`flex flex-col items-center cursor-pointer ${activeNav === 'Simulcast' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <MdLiveTv className="text-2xl mb-1" />
            <span className="text-[10px] font-bold">Simulcast</span>
          </div>
          <div onClick={() => router.push('/dashboard')} className={`flex flex-col items-center cursor-pointer ${activeNav === 'Akun' ? 'text-orange-500' : 'text-gray-400 hover:text-gray-200'}`}>
            <MdPerson className="text-2xl mb-1" />
            <span className="text-[10px] font-bold">Admin</span>
          </div>
        </div>
      )}
      <style jsx global>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .pb-safe { padding-bottom: env(safe-area-inset-bottom); }`}</style>
    </div>
  );
}
