-- PUSTAKADIO — skema awal
-- Pola: no-login, device_id (text, generated client-side) sebagai identitas,
-- konsisten dengan pola BapakAI (js/shared/state.js getDeviceId()).

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- TOPICS
create table topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  sort_order int default 0
);

insert into topics (name, slug, sort_order) values
  ('Indonesia', 'indonesia', 1),
  ('Dunia', 'dunia', 2),
  ('Sains', 'sains', 3),
  ('Teknologi', 'teknologi', 4),
  ('Sejarah', 'sejarah', 5),
  ('Budaya', 'budaya', 6),
  ('Kehidupan Sehari-hari', 'kehidupan-sehari-hari', 7),
  ('Manusia', 'manusia', 8),
  ('Lainnya', 'lainnya', 99);

-- EPISODES
create table episodes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  script text,
  topic_id uuid references topics(id),
  duration_sec int,
  audio_url text,
  cover_url text,
  status text default 'draft',        -- draft | processing | published
  tts_provider text,                   -- buat tracking biaya per episode
  play_count int default 0,
  search_text tsvector generated always as (
    to_tsvector('indonesian', coalesce(title,'') || ' ' || coalesce(description,''))
  ) stored,
  created_at timestamptz default now()
);

create index episodes_search_idx on episodes using gin(search_text);
create index episodes_topic_idx on episodes(topic_id);
create index episodes_status_idx on episodes(status);

-- SOURCES ("Sumber & Referensi")
create table sources (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid references episodes(id) on delete cascade,
  title text,
  url text,
  source_type text default 'wikipedia'
);

-- SAVED EPISODES
create table saved_episodes (
  device_id text not null,
  episode_id uuid references episodes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (device_id, episode_id)
);

-- LISTENING HISTORY
create table listening_history (
  device_id text not null,
  episode_id uuid references episodes(id) on delete cascade,
  progress_sec int default 0,
  completed boolean default false,
  last_played_at timestamptz default now(),
  primary key (device_id, episode_id)
);

-- DOWNLOADS (P1, disiapkan skemanya dari awal biar gak perlu migration lagi nanti)
create table downloads (
  device_id text not null,
  episode_id uuid references episodes(id) on delete cascade,
  downloaded_at timestamptz default now(),
  primary key (device_id, episode_id)
);

-- SEARCH DEMAND — buat tau topik yang dicari tapi belum ada episode-nya
create table search_queries (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  had_result boolean default false,
  matched_episode_id uuid references episodes(id),
  device_id text,
  created_at timestamptz default now()
);

create index search_queries_text_idx on search_queries using gin (query_text gin_trgm_ops);

-- Storage buckets (jalankan lewat Supabase Dashboard > Storage, bukan SQL):
--   episodes-audio   (public read)
--   episodes-covers  (public read)
