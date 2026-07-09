/**
 * Replaces MVP city seed with full municipality lists for all PlaySlot countries.
 * Usage: npm run db:seed-cities
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import citiesByCountry from "../supabase/seed/cities-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvFile(path) {
  const env = {};

  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      env[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
    }
  } catch {
    // optional
  }

  return env;
}

function mergeEnv(fileEnv) {
  return {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function syncCountryCities(admin, countryId, cities) {
  const { data: existing, error: existingError } = await admin
    .from("cities")
    .select("id, name_en, name_sr")
    .eq("country_id", countryId);

  if (existingError) throw existingError;

  const byName = new Map((existing ?? []).map((city) => [city.name_en, city]));
  const seedNames = new Set(cities.map((city) => city.name_en));

  let inserted = 0;
  let updated = 0;

  for (const city of cities) {
    const current = byName.get(city.name_en);

    if (current) {
      if (current.name_sr !== city.name_sr) {
        const { error } = await admin
          .from("cities")
          .update({ name_sr: city.name_sr })
          .eq("id", current.id);
        if (error) throw error;
        updated += 1;
      }
      continue;
    }

    const { error } = await admin.from("cities").insert({
      country_id: countryId,
      name_en: city.name_en,
      name_sr: city.name_sr,
    });
    if (error) throw error;
    inserted += 1;
  }

  const stale = (existing ?? []).filter((city) => !seedNames.has(city.name_en));
  if (stale.length > 0) {
    const { data: venues, error: venuesError } = await admin
      .from("venues")
      .select("city_id")
      .in(
        "city_id",
        stale.map((city) => city.id),
      );

    if (venuesError) throw venuesError;

    const usedIds = new Set((venues ?? []).map((venue) => venue.city_id));
    const removable = stale.filter((city) => !usedIds.has(city.id));

    if (removable.length > 0) {
      const { error } = await admin
        .from("cities")
        .delete()
        .in(
          "id",
          removable.map((city) => city.id),
        );
      if (error) throw error;
    }
  }

  return { inserted, updated, removed: stale.length };
}

async function main() {
  const env = mergeEnv(loadEnvFile(join(ROOT, ".env.local")));

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const admin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: countries, error: countriesError } = await admin
    .from("countries")
    .select("id, code");

  if (countriesError) throw countriesError;

  const countryByCode = Object.fromEntries(
    (countries ?? []).map((country) => [country.code, country.id]),
  );

  const summary = {};
  let totalInserted = 0;

  for (const [code, cities] of Object.entries(citiesByCountry)) {
    const countryId = countryByCode[code];
    if (!countryId) {
      console.warn(`Skipping unknown country code: ${code}`);
      continue;
    }

    const result = await syncCountryCities(admin, countryId, cities);
    totalInserted += result.inserted;

    const { count, error } = await admin
      .from("cities")
      .select("*", { count: "exact", head: true })
      .eq("country_id", countryId);

    if (error) throw error;

    summary[code] = {
      seedSize: cities.length,
      inDatabase: count ?? 0,
      ...result,
    };

    console.log(
      `${code}: ${count ?? 0} cities (${result.inserted} inserted, ${result.updated} updated)`,
    );
  }

  console.log("\nCity seed complete:");
  console.log(JSON.stringify({ totalInserted, summary }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
