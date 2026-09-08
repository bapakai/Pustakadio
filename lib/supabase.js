// Fetch-based Supabase client — tanpa @supabase/supabase-js SDK,
// biar bundle kecil & cocok buat Vercel serverless (pola sama kayak BapakAI api/_supabase.js).

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function headers(extra = {}) {
  return {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// SELECT — query string style, contoh: sb.select('episodes', '*', 'status=eq.published&order=created_at.desc&limit=20')
async function select(table, columns = '*', query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}${query ? '&' + query : ''}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function insert(table, rows, opts = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: opts.returning === false ? 'return=minimal' : 'return=representation' }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} failed: ${res.status} ${await res.text()}`);
  return opts.returning === false ? null : res.json();
}

// UPSERT — pakai on_conflict param, contoh: sb.upsert('saved_episodes', row, 'device_id,episode_id')
async function upsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase upsert ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function remove(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { method: 'DELETE', headers: headers() });
  if (!res.ok) throw new Error(`Supabase delete ${table} failed: ${res.status} ${await res.text()}`);
  return true;
}

module.exports = { select, insert, upsert, remove };
