import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { getDeviceId } from '../../lib/device';

export default function Play() {
  const router = useRouter();
  const { id } = router.query;
  const [episode, setEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/episodes?action=get&id=${id}`)
      .then((r) => r.json())
      .then((d) => setEpisode(d.episode))
      .catch((e) => console.error('Gagal load episode:', e));
  }, [id]);

  // simpan progress tiap 15 detik — dipanggil saat play, dihentikan saat pause/unmount
  useEffect(() => {
    if (!isPlaying || !episode) return;
    progressIntervalRef.current = setInterval(() => {
      const deviceId = getDeviceId();
      fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'progress',
          device_id: deviceId,
          episode_id: episode.id,
          progress_sec: Math.round(current),
        }),
      }).catch(() => {});
    }, 15000);
    return () => clearInterval(progressIntervalRef.current);
  }, [isPlaying, episode, current]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }

  function skip(seconds) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + seconds);
  }

  if (!episode) {
    return (
      <div className="player-shell">
        <p style={{ padding: 24, color: '#fff' }}>Memuat...</p>
      </div>
    );
  }

  const duration = episode.duration_sec || 1;
  const progressPct = Math.min(100, (current / duration) * 100);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div className="player-shell">
      <div className="player-top">
        <a onClick={() => router.back()} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
        </a>
        <svg viewBox="0 0 24 24" fill="#fff" style={{ width: 16, height: 16 }}>
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </div>

      <div className="player-art">
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" /><path d="M8 12a4 4 0 108 0 4 4 0 00-8 0z" />
        </svg>
      </div>

      <div className="player-cat">{episode.topics?.name?.toUpperCase() || 'PUSTAKADIO'}</div>
      <div className="player-title">{episode.title}</div>
      <div className="player-quip">{episode.description}</div>

      {episode.audio_url ? (
        <audio
          ref={audioRef}
          src={episode.audio_url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <p style={{ margin: '0 24px 12px', fontSize: 11, color: '#9FC2FF' }}>
          (Belum ada file audio — episode ini belum diproses TTS)
        </p>
      )}

      <div className="player-progress"><i style={{ width: `${progressPct}%` }} /></div>
      <div className="player-times">
        <span>{fmt(current)}</span>
        <span>-{fmt(Math.max(0, duration - current))}</span>
      </div>

      <div className="player-controls">
        <div className="side" onClick={() => skip(-15)} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
            <path d="M2 12a10 10 0 1010-10" /><path d="M2 4v8h8" />
          </svg>
        </div>
        <div className="main" onClick={togglePlay} style={{ cursor: 'pointer' }}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="var(--navy)"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="var(--navy)"><path d="M8 5v14l11-7z" /></svg>
          )}
        </div>
        <div className="side" onClick={() => skip(15)} style={{ cursor: 'pointer' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6">
            <path d="M22 12A10 10 0 1012 2" /><path d="M22 4v8h-8" />
          </svg>
        </div>
      </div>

      <div className="about-sheet">
        <h4>Tentang Episode Ini</h4>
        <p>{episode.description}</p>
        {episode.sources?.length > 0 && (
          <>
            <h4 style={{ marginTop: 14 }}>Sumber &amp; Referensi</h4>
            {episode.sources.map((s, i) => (
              <p key={i}><a href={s.url} target="_blank" rel="noreferrer" style={{ color: '#8FBCFF' }}>{s.title}</a></p>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
