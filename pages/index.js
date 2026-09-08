import { useEffect, useState } from 'react';
import { getDeviceId } from '../lib/device';

export default function Home() {
  const [daily, setDaily] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = getDeviceId();

    async function load() {
      try {
        const [dailyRes, historyRes] = await Promise.all([
          fetch('/api/episodes?action=daily').then((r) => r.json()),
          fetch(`/api/user?action=history&device_id=${deviceId}&limit=1`).then((r) => r.json()),
        ]);
        setDaily(dailyRes.episodes || []);
        setHistory(historyRes.history || []);
      } catch (e) {
        console.error('Gagal load Home:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Memuat...</div>;

  return (
    <main style={{ padding: '16px', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 13, fontWeight: 800 }}>Mau tahu apa hari ini?</h1>

      {history[0] && (
        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700 }}>Lanjutkan Mendengarkan</h2>
          <EpisodeRow episode={history[0].episodes} />
        </section>
      )}

      <section style={{ marginTop: 16 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700 }}>Pengetahuan hari ini</h2>
        {daily.map((ep) => (
          <EpisodeRow key={ep.id} episode={ep} />
        ))}
        {daily.length === 0 && (
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>
            Belum ada episode published. Jalankan content pipeline dulu.
          </p>
        )}
      </section>
    </main>
  );
}

function EpisodeRow({ episode }) {
  if (!episode) return null;
  const minutes = Math.round((episode.duration_sec || 0) / 60);
  return (
    <a href={`/play/${episode.id}`} style={{ display: 'flex', gap: 10, padding: '8px 0' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--light-blue)', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{episode.title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{minutes} menit</div>
      </div>
    </a>
  );
}
