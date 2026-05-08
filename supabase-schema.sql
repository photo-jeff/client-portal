-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create table clients (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  partner1_name text not null,
  partner2_name text not null,
  wedding_date date,
  ceremony_venue text,
  ceremony_time text,
  reception_venue text,
  package_name text,
  portal_slug text not null unique,
  vsco_job_id text,
  zoho_contact_id text,
  invite_sent_at timestamptz,
  created_at timestamptz default now()
);

create table questionnaire_responses (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  data jsonb not null default '{}',
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique(client_id)
);

create table shot_list_items (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  description text not null,
  category text not null,
  people text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table clients enable row level security;
alter table questionnaire_responses enable row level security;
alter table shot_list_items enable row level security;

-- Clients can only see their own record
create policy "Clients read own record"
  on clients for select
  using (email = auth.jwt() ->> 'email');

-- Clients can read/write their own questionnaire
create policy "Clients manage own questionnaire"
  on questionnaire_responses for all
  using (client_id in (
    select id from clients where email = auth.jwt() ->> 'email'
  ));

-- Clients can read/write their own shot list
create policy "Clients manage own shot list"
  on shot_list_items for all
  using (client_id in (
    select id from clients where email = auth.jwt() ->> 'email'
  ));

-- Service role (admin) bypasses RLS automatically
