// /api/episodes — action-based endpoint (list | get | search | daily)
// Satu function buat semua operasi baca episode, biar hemat kuota
// 12-function limit di Vercel Hobby (pola sama kayak api/content.js di BapakAI).

const sb = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  try {
    const action = req.query.action || (req.method === 'POST' ? req.body?.action : null);

    if (!action) {
      return res.status(400).json({ error: 'action wajib diisi (list | get | search | daily)' });
    }

    switch (action) {
      case 'list': {
        const { topic, limit = 20, offset = 0 } = req.query;
        let query = `status=eq.published&order=created_at.desc&limit=${limit}&offset=${offset}`;
        if (topic) query += `&topic_id=eq.${topic}`;
        const episodes = await sb.select('episodes', '*,topics(name,slug)', query);
        return res.status(200).json({ episodes });
      }

      case 'get': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id wajib diisi' });
        const rows = await sb.select(
          'episodes',
          '*,topics(name,slug),sources(title,url)',
          `id=eq.${id}`
        );
        if (!rows.length) return res.status(404).json({ error: 'Episode tidak ditemukan' });
        return res.status(200).json({ episode: rows[0] });
      }

      case 'search': {
        const { q, device_id } = req.method === 'POST' ? req.body : req.query;
        if (!q || q.trim().length < 2) {
          return res.status(400).json({ error: 'Query pencarian terlalu pendek' });
        }
        // full-text search pakai kolom search_text (tsvector, sudah di-index)
        const episodes = await sb.select(
          'episodes',
          '*,topics(name,slug)',
          `status=eq.published&search_text=fts.${encodeURIComponent(q)}&limit=15`
        );

        // catat demand signal — dipakai buat nentuin episode apa yang perlu dibuat
        // fire-and-forget, gak nge-block response ke user
        sb.insert(
          'search_queries',
          [{ query_text: q, had_result: episodes.length > 0, device_id: device_id || null }],
          { returning: false }
        ).catch(() => {}); // gagal log gak boleh gagalin search

        return res.status(200).json({ episodes });
      }

      case 'daily': {
        // rekomendasi harian sederhana buat P0: random 3 episode published
        // (bisa diganti logic lebih pintar di P1/P2 tanpa ubah kontrak API)
        const episodes = await sb.select(
          'episodes',
          '*,topics(name,slug)',
          `status=eq.published&order=created_at.desc&limit=8`
        );
        const shuffled = episodes.sort(() => 0.5 - Math.random()).slice(0, 3);
        return res.status(200).json({ episodes: shuffled });
      }

      default:
        return res.status(400).json({ error: `action '${action}' tidak dikenali` });
    }
  } catch (err) {
    console.error('api/episodes error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};
