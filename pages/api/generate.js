// /api/generate — content pipeline, action-based (script | audio | full)
// Dipanggil MANUAL dulu (lewat POST, bukan dari UI publik) — belum dijadwalkan cron.
// Dilindungi GENERATE_SECRET biar gak dipanggil sembarang orang (ini yang mahal: Claude + TTS).

import * as sb from '../../lib/supabase.js';
import { uploadFile } from '../../lib/storage.js';

const BRAND_SYSTEM_PROMPT = `Kamu adalah penulis naskah untuk Pustakadio, aplikasi audio-first knowledge discovery.
Tone: ringan, casual, curious, seperti ngobrol sama teman — BUKAN akademis, BUKAN terasa seperti aplikasi edukasi formal.
Hindari: "tingkatkan wawasan Anda", "perluas cakrawala intelektual", bahasa korporat/inspirational.
Gunakan gaya: "Yuk cari tahu", "Ternyata...", "Coba tebak..." — obrolan santai, bukan kuliah.
Panjang naskah: 550-750 kata (setara 5-7 menit audio saat dibacakan).
Struktur: buka dengan hook rasa penasaran, isi 2-4 fakta menarik, tutup dengan kesimpulan ringan (bukan "kesimpulannya adalah" yang formal).
Selalu jawab HANYA dalam format JSON valid, tanpa markdown fence, dengan schema:
{"title": "...", "description": "1 kalimat pendek buat preview card", "script": "naskah lengkap"}`;

async function generateScript(topicBrief) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: BRAND_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Buatkan naskah episode tentang: ${topicBrief}` }],
    }),
  });
  if (!res.ok) throw new Error(`Claude API gagal: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

async function generateAudio(script) {
  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: script },
        voice: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Google TTS gagal: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return Buffer.from(data.audioContent, 'base64'); // audioContent = base64 MP3
}

function estimateDuration(script) {
  const words = script.trim().split(/\s+/).length;
  return Math.round((words / 150) * 60); // ~150 kata/menit buat Bahasa Indonesia dibacakan
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Pakai POST' });

  const { action, secret, topic_brief, topic_slug, episode_id } = req.body || {};

  if (secret !== process.env.GENERATE_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (action) {
      case 'script': {
        if (!topic_brief) return res.status(400).json({ error: 'topic_brief wajib diisi' });
        const { title, description, script } = await generateScript(topic_brief);

        let topicId = null;
        if (topic_slug) {
          const topics = await sb.select('topics', 'id', `slug=eq.${topic_slug}`);
          topicId = topics[0]?.id || null;
        }

        const [episode] = await sb.insert('episodes', [
          {
            title,
            description,
            script,
            topic_id: topicId,
            duration_sec: estimateDuration(script),
            status: 'draft', // belum published — nunggu audio
          },
        ]);
        return res.status(200).json({ episode });
      }

      case 'audio': {
        if (!episode_id) return res.status(400).json({ error: 'episode_id wajib diisi' });
        const rows = await sb.select('episodes', 'id,script,duration_sec', `id=eq.${episode_id}`);
        const episode = rows[0];
        if (!episode) return res.status(404).json({ error: 'Episode tidak ditemukan' });
        if (!episode.script) return res.status(400).json({ error: 'Episode belum punya script' });

        const audioBuffer = await generateAudio(episode.script);
        const audioUrl = await uploadFile('episodes-audio', `${episode_id}.mp3`, audioBuffer, 'audio/mpeg');

        const [updated] = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/episodes?id=eq.${episode_id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({
              audio_url: audioUrl,
              tts_provider: 'google-neural2',
              status: 'published',
            }),
          }
        ).then((r) => r.json());

        return res.status(200).json({ episode: updated });
      }

      case 'full': {
        if (!topic_brief) return res.status(400).json({ error: 'topic_brief wajib diisi' });
        const { title, description, script } = await generateScript(topic_brief);

        let topicId = null;
        if (topic_slug) {
          const topics = await sb.select('topics', 'id', `slug=eq.${topic_slug}`);
          topicId = topics[0]?.id || null;
        }

        const audioBuffer = await generateAudio(script);

        const [episode] = await sb.insert('episodes', [
          {
            title,
            description,
            script,
            topic_id: topicId,
            duration_sec: estimateDuration(script),
            status: 'draft',
          },
        ]);

        const audioUrl = await uploadFile('episodes-audio', `${episode.id}.mp3`, audioBuffer, 'audio/mpeg');

        const [updated] = await fetch(
          `${process.env.SUPABASE_URL}/rest/v1/episodes?id=eq.${episode.id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: process.env.SUPABASE_SERVICE_KEY,
              Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ audio_url: audioUrl, tts_provider: 'google-neural2', status: 'published' }),
          }
        ).then((r) => r.json());

        return res.status(200).json({ episode: updated });
      }

      default:
        return res.status(400).json({ error: `action '${action}' tidak dikenali (script | audio | full)` });
    }
  } catch (err) {
    console.error('api/generate error:', err);
    return res.status(500).json({ error: err.message || 'Terjadi kesalahan server' });
  }
}
