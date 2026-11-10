-- Shared cache of AI care estimates per species (Gardenfy 1.2.0).
-- One row per species: every installation reuses it, so Gemini is asked once per species.
-- Only the species name is stored; no user, device or photo data.
create table public.care_estimates (
  species_key text primary key,
  scientific_name text not null,
  known boolean not null,
  watering_min smallint,
  watering_max smallint,
  light_sun text,
  light_bright text,
  light_shade text,
  model text not null,
  generated_at timestamptz not null default now(),
  constraint care_estimates_species_key_format check (species_key = lower(species_key) and char_length(species_key) between 3 and 120),
  constraint care_estimates_known_values check (
    (known and watering_min between 1 and 60 and watering_max between watering_min and 60
      and light_sun in ('ideal', 'ok', 'poor') and light_bright in ('ideal', 'ok', 'poor') and light_shade in ('ideal', 'ok', 'poor'))
    or (not known and watering_min is null and watering_max is null and light_sun is null and light_bright is null and light_shade is null)
  )
);

alter table public.care_estimates enable row level security;
alter table public.care_estimates force row level security;

revoke all on table public.care_estimates from public, anon, authenticated;
grant select, insert, update on table public.care_estimates to service_role;
