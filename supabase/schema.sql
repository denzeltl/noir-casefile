-- Noir Casefile Ad Studio schema. Run in the Supabase SQL editor.
create table if not exists cases (
  id          text primary key,              -- existing "case-…" id
  created_at  timestamptz not null default now(),
  difficulty  text not null,
  case_json   jsonb not null,                -- full Case, server-only (contains the solution)
  brief_json  jsonb not null,                -- spoiler-free AdBrief
  alerted_at  timestamptz                    -- set by n8n after the Telegram alert
);

create table if not exists ad_runs (
  id               text primary key,         -- = LangGraph thread_id
  case_id          text not null references cases(id) on delete cascade,
  status           text not null default 'running' check (status in (
                     'running','waiting_hook','waiting_render','rendering','render_failed',
                     'waiting_video','ready_to_post','discarded','failed')),
  hooks_json       jsonb,
  chosen_hook      jsonb,
  storyboard_json  jsonb,
  video_url        text,
  loops            int not null default 0,
  error            text,
  claimed_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One active run per case (makes POST /api/ads/runs idempotent against double taps).
create unique index if not exists ad_runs_one_active_per_case on ad_runs (case_id)
  where status not in ('ready_to_post','discarded','failed');

create table if not exists worker_heartbeat (
  id                text primary key default 'render-worker',
  worker_last_seen  timestamptz not null default now()
);

-- Server uses the service-role key; lock everything else out.
alter table cases enable row level security;
alter table ad_runs enable row level security;
alter table worker_heartbeat enable row level security;
