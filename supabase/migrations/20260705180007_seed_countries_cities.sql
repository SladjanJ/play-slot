INSERT INTO public.countries (code, name_en, name_sr) VALUES
  ('RS', 'Serbia', 'Srbija'),
  ('BA', 'Bosnia and Herzegovina', 'Bosna i Hercegovina'),
  ('ME', 'Montenegro', 'Crna Gora'),
  ('HR', 'Croatia', 'Hrvatska'),
  ('MK', 'North Macedonia', 'Severna Makedonija'),
  ('AL', 'Albania', 'Albanija'),
  ('SI', 'Slovenia', 'Slovenija');

INSERT INTO public.cities (country_id, name_en, name_sr)
SELECT c.id, v.name_en, v.name_sr
FROM public.countries c
JOIN (
  VALUES
    ('RS', 'Belgrade', 'Beograd'),
    ('RS', 'Novi Sad', 'Novi Sad'),
    ('RS', 'Nis', 'Niš'),
    ('RS', 'Kragujevac', 'Kragujevac'),
    ('RS', 'Subotica', 'Subotica'),
    ('BA', 'Sarajevo', 'Sarajevo'),
    ('BA', 'Banja Luka', 'Banja Luka'),
    ('BA', 'Mostar', 'Mostar'),
    ('BA', 'Tuzla', 'Tuzla'),
    ('ME', 'Podgorica', 'Podgorica'),
    ('ME', 'Niksic', 'Nikšić'),
    ('ME', 'Budva', 'Budva'),
    ('HR', 'Zagreb', 'Zagreb'),
    ('HR', 'Split', 'Split'),
    ('HR', 'Rijeka', 'Rijeka'),
    ('HR', 'Osijek', 'Osijek'),
    ('MK', 'Skopje', 'Skopje'),
    ('MK', 'Bitola', 'Bitola'),
    ('AL', 'Tirana', 'Tirana'),
    ('AL', 'Durres', 'Durrës'),
    ('SI', 'Ljubljana', 'Ljubljana'),
    ('SI', 'Maribor', 'Maribor')
) AS v(country_code, name_en, name_sr) ON v.country_code = c.code;
