-- Ensure idempotent upserts by country + English name
CREATE UNIQUE INDEX IF NOT EXISTS cities_country_id_name_en_unique
  ON public.cities (country_id, name_en);
