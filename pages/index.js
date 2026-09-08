import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDeviceId } from '../lib/device';
import BottomTabBar from '../components/BottomTabBar';
import EpisodeRow from '../components/EpisodeRow';

const TOPIC_CHIPS = [
  { name: 'Indonesia', slug: 'indonesia' },
  { name: 'Dunia', slug: 'dunia' },
  { name: 'Sains', slug: 'sains' },
  { name: 'Teknologi', slug: 'teknologi' },
];

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

  const hero = daily[0];
  const rest = daily.slice(1);

  return (
    <div className="app-shell">
      <div className="page-logo">
        <img src="/logomark.png" alt="Pustakadio" />
      </div>

      <div style={{ padding: '6px 16px 0', fontSize: 14, fontWeight: 800 }}>
        Mau tahu apa hari ini?
      </div>

      {loading ? (
        <p className="empty-state">Memuat...</p>
      ) : (
        <>
          {hero && (
            <Link href={`/play/${hero.id}`} className="card-hero">
              <div className="dur">{Math.round((hero.duration_sec || 0) / 60)} MENIT</div>
              <h3>{hero.title}</h3>
              <div className="desc">{hero.description}</div>
              <div className="play-fab">
                <svg viewBox="0 0 24 24" fill="var(--navy)"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </Link>
          )}

          {history[0]?.episodes && (
            <>
              <div className="section-label">Lanjutkan Mendengarkan</div>
              <EpisodeRow episode={history[0].episodes} />
            </>
          )}

          <div className="section-label">
            Pengetahuan hari ini
            <span className="more">Lihat semua</span>
          </div>
          {rest.length > 0 ? (
            rest.map((ep) => <EpisodeRow key={ep.id} episode={ep} />)
          ) : (
            !hero && <p className="empty-state">Belum ada episode. Content pipeline belum jalan.</p>
          )}

          <div className="section-label">Atau jelajahi topik</div>
          <div className="chip-grid">
            {TOPIC_CHIPS.map((t) => (
              <Link key={t.slug} href={`/cari?topic=${t.slug}`} className="chip">
                <div className="ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      <BottomTabBar active="/" />
    </div>
  );
}
