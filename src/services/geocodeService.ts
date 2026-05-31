export interface PlaceSuggestion {
  placeId: number;
  name: string;
  displayName: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  category: string;
  type: string;
  openingHours?: string;
  website?: string;
  phone?: string;
}

/** Search for places matching a query — used for autocomplete. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=7&addressdetails=1&extratags=1`,
      { headers: { 'Accept': 'application/json' } },
    );
    if (!res.ok) return [];
    const data: NominatimResult[] = await res.json();
    return data.map(toSuggestion);
  } catch {
    return [];
  }
}

/** Geocode a single query string — used when a place has no coordinates yet. */
export async function geocodePlace(
  address: string,
  city?: string,
  name?: string,
): Promise<{ lat: number; lng: number } | null> {
  const parts = [name, address, city].filter(Boolean);
  if (!parts.length) return null;
  const results = await searchPlaces(parts.join(', '));
  if (!results.length) return null;
  return { lat: results[0].lat, lng: results[0].lng };
}

// ── Internal ──────────────────────────────────────────────────────

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  category: string;
  type: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
  extratags?: {
    opening_hours?: string;
    website?: string;
    phone?: string;
    'contact:website'?: string;
    'contact:phone'?: string;
  };
}

function toSuggestion(r: NominatimResult): PlaceSuggestion {
  const addr = r.address;
  const city = addr.city || addr.town || addr.village || addr.suburb || addr.state || '';
  // Build a clean short address (road + postcode)
  const road = [addr.road, addr.postcode].filter(Boolean).join(', ');

  // Extract the place name from display_name (first segment)
  const namePart = r.display_name.split(',')[0].trim();

  return {
    placeId: r.place_id,
    name: namePart,
    displayName: r.display_name,
    address: road,
    city,
    country: addr.country || '',
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    category: r.category,
    type: r.type,
    openingHours: r.extratags?.opening_hours,
    website: r.extratags?.website || r.extratags?.['contact:website'],
    phone: r.extratags?.phone || r.extratags?.['contact:phone'],
  };
}
