import { useEffect, useState } from 'react';
import { getDeviceId } from '../lib/device';
import BottomTabBar from '../components/BottomTabBar';
import EpisodeRow from '../components/EpisodeRow';

const TABS = ['Tersimpan', 'Riwayat'];

export default function Koleksi() {
  const [tab, setTab] = useState('Tersimpan');
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const deviceId = getDeviceId();
    async function load() {
      try {
        const [savedRes, historyRes] = await Promise.all([
          fetch(`/api/user?action=saved-list&device_id=${deviceId}`).then((r) => r.json()),
          fetch(`/api/user?action=history&device_id=${deviceId}&limit=20`).then((r) => r.json()),
        ]);
        setSaved(savedRes.episodes || []);
        setHistory((historyRes.history || []).map((h) => h.episodes));
      } catch (e) {
        console.error('Gagal load Koleksi:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const list = tab === 'Tersimpan' ? saved : history;

  return (
    <div className="app-shell">
      <div style={{ padding: '16px 16px 0', fontSize: 15, fontWeight: 800 }}>Koleksiku</div>

      <div className="seg">
        {TABS.map((t) => (
          <div key={t} className={`s ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      {loading ? (
        <p className="empty-state">Memuat...</p>
      ) : list.length > 0 ? (
        list.map((ep) => ep && <EpisodeRow key={ep.id} episode={ep} />)
      ) : (
        <p className="empty-state">
          {tab === 'Tersimpan' ? 'Belum ada episode tersimpan.' : 'Belum ada riwayat mendengarkan.'}
        </p>
      )}

      <BottomTabBar active="/koleksi" />
    </div>
  );
}
