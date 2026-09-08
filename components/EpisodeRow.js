import Link from 'next/link';

export default function EpisodeRow({ episode }) {
  if (!episode) return null;
  const minutes = Math.max(1, Math.round((episode.duration_sec || 0) / 60));
  return (
    <Link href={`/play/${episode.id}`} className="list-item">
      <div className="thumb" />
      <div className="meta">
        <h5>{episode.title}</h5>
        <small>{minutes} menit{episode.topics?.name ? ` · ${episode.topics.name}` : ''}</small>
      </div>
      <div className="mini-play">
        <svg viewBox="0 0 24 24" fill="var(--navy)"><path d="M8 5v14l11-7z" /></svg>
      </div>
    </Link>
  );
}
