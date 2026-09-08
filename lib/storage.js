// Upload ke Supabase Storage — endpoint beda dari /rest/v1 (lib/supabase.js),
// jadi helper terpisah. Pakai service_role key, bypass RLS.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// uploadFile('episodes-audio', 'ep_123.mp3', buffer, 'audio/mpeg')
// return: public URL file-nya
export async function uploadFile(bucket, path, buffer, contentType) {
  const url = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': contentType,
      'x-upsert': 'true', // overwrite kalau path sama
    },
    body: buffer,
  });
  if (!res.ok) {
    throw new Error(`Upload ke storage gagal: ${res.status} ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
