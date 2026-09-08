import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getDeviceId } from '../lib/device';
import BottomTabBar from '../components/BottomTabBar';
import EpisodeRow from '../components/EpisodeRow';

export default function Cari() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null = belum search
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/episodes?action=list&limit=8')
      .then((r) => r.json())
      .then((d) => setPopular(d.episodes || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const topicFromUrl = router.query.topic;
    if (topicFromUrl) {
      setQ('');
      fetch(`/api/episodes?action=list&topic=${topicFromUrl}`)
        .then((r) => r.json())
        .then((d) => setResults(d.episodes || []));
    }
  }, [router.query.topic]);

  async function doSearch(query) {
    setQ(query);
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const deviceId = getDeviceId();
      const res = await fetch(
        `/api/episodes?action=search&q=${encodeURIComponent(query)}&device_id=${deviceId}`
      );
      const data = await res.json();
      setResults(data.episodes || []);
    } catch (e) {
      console.error('Search gagal:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ padding: '16px 16px 0', fontSize: 15, fontWeight: 800 }}>Cari</div>

      <div className="search-pill">
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <input
          placeholder="Mau tahu apa?"
          value={q}
          onChange={(e) => doSearch(e.target.value)}
        />
      </div>

      {loading && <p className="empty-state">Mencari...</p>}

      {results !== null && !loading ? (
        <>
          <div className="section-label">Hasil</div>
          {results.length > 0 ? (
            results.map((ep) => <EpisodeRow key={ep.id} episode={ep} />)
          ) : (
            <p className="empty-state">Belum ketemu. Coba kata lain, atau episode-nya lagi disiapin.</p>
          )}
        </>
      ) : (
        <>
          <div className="section-label">
            Topik Populer<span className="more">Lihat semua</span>
          </div>
          {popular.length > 0 ? (
            popular.map((ep) => <EpisodeRow key={ep.id} episode={ep} />)
          ) : (
            <p className="empty-state">Belum ada episode.</p>
          )}
        </>
      )}

      <BottomTabBar active="/cari" />
    </div>
  );
}
