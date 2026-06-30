-- HandyGo Seed Data
-- Initial database seed for Categories and Salerno municipalities

-- 1. Seed Categories
insert into public.categories (name, slug, icon, active) values
  ('Idraulico', 'idraulico', '🚰', true),
  ('Elettricista', 'elettricista', '⚡', true),
  ('Fabbro', 'fabbro', '🔑', true),
  ('Muratore', 'muratore', '🧱', true),
  ('Imbianchino', 'imbianchino', '🎨', true),
  ('Giardiniere', 'giardiniere', '🌿', true),
  ('Tecnico caldaie', 'tecnico-caldaie', '🔥', true),
  ('Climatizzatori', 'climatizzatori', '❄️', true),
  ('Antennista', 'antennista', '📡', true),
  ('Falegname', 'falegname', '🪵', true),
  ('Saldatore', 'saldatore', '⚡', true),
  ('Impresa pulizie', 'impresa-pulizie', '🧹', true),
  ('Traslochi', 'traslochi', '📦', true),
  ('Serramentista', 'serramentista', '🪟', true),
  ('Piastrellista', 'piastrellista', '🧱', true),
  ('Cartongessista', 'cartongessista', '🧱', true)
on conflict (slug) do nothing;

-- 2. Seed Salerno Locations
insert into public.italian_locations (city, province, region, active) values
  ('Angri', 'Salerno', 'Campania', true),
  ('Scafati', 'Salerno', 'Campania', true),
  ('Nocera Inferiore', 'Salerno', 'Campania', true),
  ('Nocera Superiore', 'Salerno', 'Campania', true),
  ('Pagani', 'Salerno', 'Campania', true),
  ('Sarno', 'Salerno', 'Campania', true),
  ('San Marzano sul Sarno', 'Salerno', 'Campania', true),
  ('Sant’Egidio del Monte Albino', 'Salerno', 'Campania', true),
  ('Corbara', 'Salerno', 'Campania', true),
  ('Salerno', 'Salerno', 'Campania', true),
  ('Cava de’ Tirreni', 'Salerno', 'Campania', true),
  ('Mercato San Severino', 'Salerno', 'Campania', true),
  ('Baronissi', 'Salerno', 'Campania', true),
  ('Fisciano', 'Salerno', 'Campania', true),
  ('Pontecagnano Faiano', 'Salerno', 'Campania', true),
  ('Battipaglia', 'Salerno', 'Campania', true),
  ('Eboli', 'Salerno', 'Campania', true),
  ('Capaccio Paestum', 'Salerno', 'Campania', true)
on conflict (city, province) do update set
  region = excluded.region,
  active = excluded.active;
