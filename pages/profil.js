import { useEffect, useState } from 'react';
import { getDeviceId } from '../lib/device';
import BottomTabBar from '../components/BottomTabBar';

function formatCompact(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

export default function Profil() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceTag, setDeviceTag] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const deviceId = getDeviceId();
    setDeviceTag(deviceId ? deviceId.slice(-6).toUpperCase() : '');

    async function load() {
      try {
        const res = await fetch(`/api/user?action=stats&device_id=${deviceId}`).then((r) =>
          r.json()
        );
        setStats(res);
      } catch (e) {
        console.error('Gagal load stats profil:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleReset() {
    const ok = window.confirm(
      'Ini bakal reset progress mendengarkan, episode tersimpan, dan riwayat di perangkat ini. Yakin lanjut?'
    );
    if (!ok) return;
    setResetting(true);
    localStorage.removeItem('pustakadio_device_id');
    window.location.href = '/';
  }

  return (
    <div className="app-shell">
      <div style={{ padding: '16px 16px 0', fontSize: 15, fontWeight: 800 }}>Profil</div>

      <div className="profil-id">
        <div className="avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h4>Pendengar Pustakadio</h4>
          <small>
            {deviceTag ? `Perangkat ini · ID ${deviceTag}` : 'Perangkat ini'} · tanpa akun, tanpa ribet
          </small>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">Memuat...</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-tile">
              <div className="v">{formatCompact(stats?.total_completed || 0)}</div>
              <div className="l">Episode selesai</div>
            </div>
            <div className="stat-tile">
              <div className="v">{formatCompact(stats?.total_minutes || 0)}</div>
              <div className="l">Menit didengar</div>
            </div>
            <div className="stat-tile">
              <div className="v">{formatCompact(stats?.total_saved || 0)}</div>
              <div className="l">Tersimpan</div>
            </div>
          </div>

          {stats?.top_topic && (
            <div className="topic-row" style={{ marginTop: 4 }}>
              <div className="topic-pill">🎧 Paling sering dengar: {stats.top_topic}</div>
            </div>
          )}
        </>
      )}

      <div className="about-card">
        <div className="tag">TENTANG</div>
        <h4>Putar Pengetahuannya.</h4>
        <p>
          Pustakadio itu Spotify buat rasa ingin tahu sehari-hari — bukan Wikipedia versi audio,
          bukan aplikasi belajar formal. Tinggal pencet play, dengerin, ternyata jadi tahu.
        </p>
        <div className="ver">Pustakadio · MVP v0.1</div>
      </div>

      <button className="reset-btn" onClick={handleReset} disabled={resetting}>
        {resetting ? 'Mereset...' : 'Reset Data Perangkat Ini'}
      </button>
      <p className="reset-hint">
        Menghapus progress, tersimpan, dan riwayat mendengarkan yang terikat ke perangkat ini.
        Gak bisa dibalikin.
      </p>

      <BottomTabBar active="/profil" />
    </div>
  );
}
