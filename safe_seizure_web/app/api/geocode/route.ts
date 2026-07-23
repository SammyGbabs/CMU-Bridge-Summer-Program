import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side geocoding proxy for OpenStreetMap's Nominatim API.
 * Kept server-side because Nominatim's usage policy requires a real,
 * identifying User-Agent header, which browsers refuse to let client
 * JS set on outgoing fetches.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SafeSeizure-Dashboard/1.0 (educational project; contact via app)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ result: null }, { status: 200 });
    }

    const results = await response.json();

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ result: null });
    }

    const { lat, lon, display_name } = results[0];

    return NextResponse.json({
      result: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        displayName: display_name as string,
      },
    });
  } catch {
    return NextResponse.json({ result: null }, { status: 200 });
  }
}
