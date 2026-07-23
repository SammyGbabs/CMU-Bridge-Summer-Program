export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName?: string;
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query.trim()) return null;

  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    if (!response.ok) return null;

    const data = await response.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}
