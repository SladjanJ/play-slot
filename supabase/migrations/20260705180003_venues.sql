-- Slug generator
CREATE OR REPLACE FUNCTION public.generate_venue_slug(p_company_name text, p_city_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  city_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  SELECT lower(trim(both '-' FROM regexp_replace(name_en, '[^a-zA-Z0-9]+', '-', 'g')))
  INTO city_slug
  FROM public.cities
  WHERE id = p_city_id;

  base_slug := lower(trim(both '-' FROM regexp_replace(p_company_name, '[^a-zA-Z0-9]+', '-', 'g')));
  final_slug := base_slug || '-' || city_slug;

  WHILE EXISTS (SELECT 1 FROM public.venues WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || city_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$;

-- Venues
CREATE TABLE public.venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities (id) ON DELETE RESTRICT,
  company_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  address text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  timezone text NOT NULL,
  slot_duration_minutes int NOT NULL,
  max_consecutive_slots int NOT NULL DEFAULT 3,
  price_per_slot numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  confirmation_mode text NOT NULL CHECK (confirmation_mode IN ('auto', 'pending')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX venues_city_id_idx ON public.venues (city_id);
CREATE INDEX venues_status_idx ON public.venues (status);
CREATE INDEX venues_slug_idx ON public.venues (slug);
CREATE INDEX venues_company_name_trgm_idx ON public.venues USING gin (company_name gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.is_venue_owner(p_venue_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.venues
    WHERE id = p_venue_id
      AND host_id = auth.uid()
  );
$$;

CREATE TRIGGER venues_set_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Working hours
CREATE TABLE public.venue_working_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues (id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at time,
  closes_at time,
  is_closed boolean NOT NULL DEFAULT false,
  UNIQUE (venue_id, day_of_week)
);
