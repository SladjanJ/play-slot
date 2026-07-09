type NominatimReverseResult = {
  display_name?: string;
};

type NominatimSearchResult = {
  lat: string;
  lon: string;
};

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return "";

  const data = (await response.json()) as NominatimReverseResult;
  return data.display_name ?? "";
}

export async function geocodeCity(
  cityName: string,
  countryName: string,
): Promise<{ lat: number; lng: number } | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", `${cityName}, ${countryName}`);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;

  const results = (await response.json()) as NominatimSearchResult[];
  const first = results[0];
  if (!first) return null;

  return { lat: Number(first.lat), lng: Number(first.lon) };
}
