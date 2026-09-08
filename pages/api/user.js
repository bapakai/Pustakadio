// /api/user — action-based endpoint (save | unsave | saved-list | progress | history)
// Semua operasi per-device (Koleksiku: Tersimpan/Riwayat), device_id dari client (localStorage),
// no login — sama pola dengan device_id BapakAI.

import * as sb from '../../lib/supabase.js';

export default async function handler(req, res) {
  try {
    const body = req.method === 'POST' ? req.body : req.query;
    const { action, device_id } = body;

    if (!action) return res.status(400).json({ error: 'action wajib diisi' });
    if (!device_id) return res.status(400).json({ error: 'device_id wajib diisi' });

    switch (action) {
      case 'save': {
        const { episode_id } = body;
        if (!episode_id) return res.status(400).json({ error: 'episode_id wajib diisi' });
        await sb.upsert(
          'saved_episodes',
          [{ device_id, episode_id }],
          'device_id,episode_id'
        );
        return res.status(200).json({ ok: true });
      }

      case 'unsave': {
        const { episode_id } = body;
        if (!episode_id) return res.status(400).json({ error: 'episode_id wajib diisi' });
        await sb.remove(
          'saved_episodes',
          `device_id=eq.${device_id}&episode_id=eq.${episode_id}`
        );
        return res.status(200).json({ ok: true });
      }

      case 'saved-list': {
        const rows = await sb.select(
          'saved_episodes',
          'episode_id,created_at,episodes(*,topics(name,slug))',
          `device_id=eq.${device_id}&order=created_at.desc`
        );
        return res.status(200).json({ episodes: rows.map((r) => r.episodes) });
      }

      case 'progress': {
        // dipanggil berkala dari player (misal tiap 15 detik) buat nyimpen posisi dengar
        const { episode_id, progress_sec, completed = false } = body;
        if (!episode_id) return res.status(400).json({ error: 'episode_id wajib diisi' });
        await sb.upsert(
          'listening_history',
          [{ device_id, episode_id, progress_sec, completed, last_played_at: new Date().toISOString() }],
          'device_id,episode_id'
        );
        return res.status(200).json({ ok: true });
      }

      case 'history': {
        // buat "Lanjutkan Mendengarkan" di Home + tab Riwayat di Koleksiku
        const { limit = 10 } = body;
        const rows = await sb.select(
          'listening_history',
          'episode_id,progress_sec,completed,last_played_at,episodes(*,topics(name,slug))',
          `device_id=eq.${device_id}&completed=eq.false&order=last_played_at.desc&limit=${limit}`
        );
        return res.status(200).json({ history: rows });
      }

      default:
        return res.status(400).json({ error: `action '${action}' tidak dikenali` });
    }
  } catch (err) {
    console.error('api/user error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
