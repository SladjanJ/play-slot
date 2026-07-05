-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

-- Countries
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_en text NOT NULL,
  name_sr text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cities
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id uuid NOT NULL REFERENCES public.countries (id) ON DELETE RESTRICT,
  name_en text NOT NULL,
  name_sr text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cities_country_id_idx ON public.cities (country_id);
CREATE INDEX cities_country_id_name_en_idx ON public.cities (country_id, name_en);
