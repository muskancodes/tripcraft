import { useState, useRef, useEffect, useCallback } from 'react';
import { Trip, Place, PlaceCategory } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Heart, Star, MapPin, Globe, Clock, DollarSign,
  Trash2, CheckSquare, Square, Search, Navigation, Loader2, Sparkles, Pencil, Check
} from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency, CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import { geocodePlace, searchPlaces, PlaceSuggestion } from '../../services/geocodeService';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const CATEGORIES: PlaceCategory[] = [
  'attraction','restaurant','hotel','shopping','hidden_gem','museum','park','beach','nightlife','other',
];

const EMPTY: Omit<Place, 'id'> = {
  name: '', description: '', address: '', city: '', category: 'attraction',
  openingHours: '', cost: 0, rating: 0, website: '', notes: '',
  isFavorite: false, mustVisit: false, priority: 3, visited: false,
};

// Map Nominatim category/type → PlaceCategory
function osmToCategory(category: string, type: string): PlaceCategory {
  if (category === 'tourism') {
    if (['hotel', 'guest_house', 'hostel', 'motel'].includes(type)) return 'hotel';
    if (['museum', 'gallery'].includes(type)) return 'museum';
    if (['beach'].includes(type)) return 'beach';
    return 'attraction';
  }
  if (category === 'amenity') {
    if (['restaurant', 'cafe', 'fast_food', 'food_court', 'pub'].includes(type)) return 'restaurant';
    if (['bar', 'nightclub', 'casino'].includes(type)) return 'nightlife';
    if (['hotel', 'motel'].includes(type)) return 'hotel';
    if (['museum'].includes(type)) return 'museum';
    return 'other';
  }
  if (category === 'shop') return 'shopping';
  if (category === 'leisure') {
    if (['park', 'garden', 'nature_reserve'].includes(type)) return 'park';
    if (['beach'].includes(type)) return 'beach';
    return 'attraction';
  }
  if (category === 'natural' && type === 'beach') return 'beach';
  return 'other';
}

export default function PlacesTab({ trip }: Props) {
  const { addPlace } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Place, 'id'>>(EMPTY);
  const [filterCat, setFilterCat] = useState<PlaceCategory | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) { setSuggestions([]); return; }
    setLoadingSuggestions(true);
    const results = await searchPlaces(query);
    setSuggestions(results);
    setShowSuggestions(results.length > 0);
    setLoadingSuggestions(false);
  }, []);

  const handleNameChange = (value: string) => {
    setForm(p => ({ ...p, name: value }));
    setAutoFilled(false);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setForm(p => ({
      ...p,
      name: s.name,
      address: s.address || p.address,
      city: s.city || p.city,
      category: osmToCategory(s.category, s.type),
      website: s.website || p.website,
      openingHours: s.openingHours || p.openingHours,
      lat: s.lat,
      lng: s.lng,
    }));
    setAutoFilled(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.closest('.autocomplete-wrapper')?.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAdd = () => {
    if (!form.name) { toast.error('Place name required'); return; }
    setSaving(true);

    if (form.lat && form.lng) {
      // Coordinates already set from autocomplete — save directly
      addPlace(trip.id, form);
      setForm(EMPTY);
      setAutoFilled(false);
      setShowForm(false);
      toast.success('Place saved & pinned on map ✅');
      setSaving(false);
    } else {
      // Fallback: geocode from address/city/name
      const toastId = toast.loading('Finding location on map…');
      geocodePlace(form.address, form.city, form.name).then(coords => {
        addPlace(trip.id, coords ? { ...form, lat: coords.lat, lng: coords.lng } : form);
        setForm(EMPTY);
        setAutoFilled(false);
        setShowForm(false);
        toast.success(coords ? 'Place saved & pinned on map ✅' : 'Place saved (location not found)', { id: toastId });
      }).catch(() => {
        addPlace(trip.id, form);
        setForm(EMPTY);
        setAutoFilled(false);
        setShowForm(false);
        toast.success('Place saved', { id: toastId });
      }).finally(() => setSaving(false));
    }
  };

  const filtered = trip.places
    .filter(p => filterCat === 'all' || p.category === filterCat)
    .filter(p => !showFavOnly || p.isFavorite)
    .filter(p => !searchQ ||
      p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQ.toLowerCase()),
    );

  const mustVisits = filtered.filter(p => p.mustVisit);
  const rest = filtered.filter(p => !p.mustVisit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white">Places ({trip.places.length})</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavOnly(!showFavOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
              showFavOnly
                ? 'bg-pink-600/20 border-pink-500/30 text-pink-300'
                : 'border-white/10 text-gray-400 hover:text-white'
            }`}>
            <Heart className="w-3.5 h-3.5" /> Favorites
          </button>
          <button onClick={() => { setShowForm(!showForm); setForm(EMPTY); setAutoFilled(false); }} disabled={saving}
            className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Place
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input-field pl-9" placeholder="Search places…"
            value={searchQ} onChange={e => setSearchQ(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <FilterBtn label="All" active={filterCat === 'all'} onClick={() => setFilterCat('all')} />
          {CATEGORIES.filter(c => trip.places.some(p => p.category === c)).map(c => (
            <FilterBtn key={c} label={`${CATEGORY_ICONS[c]} ${c}`}
              active={filterCat === c} onClick={() => setFilterCat(c)} />
          ))}
        </div>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Save a Place</h3>
              <button onClick={() => setShowForm(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>

            {/* ── Name with autocomplete ── */}
            <div className="autocomplete-wrapper relative">
              <label className="label">Name *</label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  className="input-field pr-9"
                  placeholder="Search for a place… e.g. Senso-ji Temple"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {loadingSuggestions
                    ? <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                    : <Search className="w-4 h-4 text-gray-500" />}
                </div>
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 w-full z-50 rounded-xl border border-white/10
                               bg-surface-3 shadow-card overflow-hidden"
                  >
                    {suggestions.map(s => (
                      <button
                        key={s.placeId}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(s)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                      >
                        <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{s.name}</p>
                          <p className="text-xs text-gray-500 truncate">{s.displayName}</p>
                        </div>
                        {(s.openingHours || s.website) && (
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5 ml-auto" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Auto-filled notice */}
            {autoFilled && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                Details auto-filled from OpenStreetMap — edit anything below as needed.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FF label="City" value={form.city} onChange={v => setForm(p => ({ ...p, city: v }))}
                placeholder="Tokyo" />
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value as PlaceCategory }))}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-surface-2 capitalize">
                      {CATEGORY_ICONS[c]} {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <FF label="Address" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))}
                placeholder="Street address" className="col-span-2 md:col-span-1" />
              <FF label="Opening Hours" value={form.openingHours ?? ''} onChange={v => setForm(p => ({ ...p, openingHours: v }))}
                placeholder="9am – 5pm" />
              <div>
                <label className="label">Estimated Cost (INR)</label>
                <input type="number" className="input-field" value={form.cost || ''}
                  onChange={e => setForm(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="label">Rating (0–5)</label>
                <input type="number" min="0" max="5" step="0.5" className="input-field" value={form.rating || ''}
                  onChange={e => setForm(p => ({ ...p, rating: parseFloat(e.target.value) || 0 }))} />
              </div>
              <FF label="Website" value={form.website ?? ''} onChange={v => setForm(p => ({ ...p, website: v }))}
                placeholder="https://…" className="col-span-2 md:col-span-1" />
              <FF label="Description" value={form.description ?? ''} onChange={v => setForm(p => ({ ...p, description: v }))}
                placeholder="Brief description…" className="col-span-2 md:col-span-2" />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input-field resize-none" rows={2} value={form.notes ?? ''}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="flex items-center gap-4">
              <Toggle label="Must Visit" value={form.mustVisit} onChange={v => setForm(p => ({ ...p, mustVisit: v }))} />
              <Toggle label="Favorite"   value={form.isFavorite} onChange={v => setForm(p => ({ ...p, isFavorite: v }))} />
            </div>
            {form.lat && form.lng ? (
              <p className="text-xs text-indigo-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location ready ({form.lat.toFixed(4)}, {form.lng.toFixed(4)})
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                📍 Select a suggestion above to pin on map, or location will be looked up from the address.
              </p>
            )}
            <div className="flex gap-3">
              <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm">
                {saving ? 'Saving…' : 'Save Place'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Must visit */}
      {mustVisits.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">⭐ Must Visit</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {mustVisits.map((p, i) => <PlaceCard key={p.id} place={p} tripId={trip.id} currency={trip.currency} index={i} />)}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          {mustVisits.length > 0 && (
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-4">All Places</h3>
          )}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {rest.map((p, i) => <PlaceCard key={p.id} place={p} tripId={trip.id} currency={trip.currency} index={i} />)}
          </div>
        </div>
      )}

      {filtered.length === 0 && trip.places.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📍</div>
          <p className="text-gray-500 text-sm">No places saved yet</p>
          <p className="text-gray-600 text-xs mt-1">Click "Add Place" and search by name to get started</p>
        </div>
      )}
      {filtered.length === 0 && trip.places.length > 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-gray-500 text-sm">No places match your filter</p>
        </div>
      )}
    </div>
  );
}

// ── Place card ──────────────────────────────────────────────────────

function PlaceCard({ place, tripId, currency, index }: {
  place: Place; tripId: string; currency: string; index: number;
}) {
  const { deletePlace, toggleFavoritePlace, toggleVisitedPlace, updatePlace } = useTripStore();
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Place, 'id'>>({ ...place });

  const handleSaveEdit = () => {
    updatePlace(tripId, place.id, editForm);
    setEditing(false);
    toast.success('Place updated');
  };

  const handleCancelEdit = () => {
    setEditForm({ ...place });
    setEditing(false);
  };

  const handleLocate = async () => {
    setLocating(true);
    const toastId = toast.loading('Finding location…');
    try {
      const coords = await geocodePlace(place.address, place.city, place.name);
      if (coords) {
        updatePlace(tripId, place.id, { lat: coords.lat, lng: coords.lng });
        toast.success('Location found and pinned on map', { id: toastId });
      } else {
        toast.error('Could not find location — try a more specific address', { id: toastId });
      }
    } catch {
      toast.error('Geocoding failed', { id: toastId });
    } finally {
      setLocating(false);
    }
  };

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Edit Place</h3>
          <button onClick={handleCancelEdit} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2.5">
          <FF label="Name *" value={editForm.name} onChange={v => setEditForm(p => ({ ...p, name: v }))} placeholder="Place name" />
          <div className="grid grid-cols-2 gap-2">
            <FF label="City" value={editForm.city} onChange={v => setEditForm(p => ({ ...p, city: v }))} placeholder="Tokyo" />
            <div>
              <label className="label">Category</label>
              <select className="input-field" value={editForm.category}
                onChange={e => setEditForm(p => ({ ...p, category: e.target.value as PlaceCategory }))}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-surface-2 capitalize">
                    {CATEGORY_ICONS[c]} {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FF label="Address" value={editForm.address} onChange={v => setEditForm(p => ({ ...p, address: v }))} placeholder="Street address" />
          <div className="grid grid-cols-2 gap-2">
            <FF label="Opening Hours" value={editForm.openingHours ?? ''} onChange={v => setEditForm(p => ({ ...p, openingHours: v }))} placeholder="9am – 5pm" />
            <FF label="Website" value={editForm.website ?? ''} onChange={v => setEditForm(p => ({ ...p, website: v }))} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Cost</label>
              <input type="number" className="input-field" value={editForm.cost || ''}
                onChange={e => setEditForm(p => ({ ...p, cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Rating (0–5)</label>
              <input type="number" min="0" max="5" step="0.5" className="input-field" value={editForm.rating || ''}
                onChange={e => setEditForm(p => ({ ...p, rating: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <FF label="Description" value={editForm.description ?? ''} onChange={v => setEditForm(p => ({ ...p, description: v }))} placeholder="Brief description…" />
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={2} value={editForm.notes ?? ''}
              onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex items-center gap-4">
            <Toggle label="Must Visit" value={editForm.mustVisit} onChange={v => setEditForm(p => ({ ...p, mustVisit: v }))} />
            <Toggle label="Favorite" value={editForm.isFavorite} onChange={v => setEditForm(p => ({ ...p, isFavorite: v }))} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSaveEdit} className="btn-primary text-sm flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={handleCancelEdit} className="btn-secondary text-sm">Cancel</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className={`glass-card p-4 relative group transition-all ${place.visited ? 'opacity-60' : ''}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: `${CATEGORY_COLORS[place.category]}20` }}>
            {CATEGORY_ICONS[place.category]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">{place.name}</h3>
            <span className="text-xs capitalize" style={{ color: CATEGORY_COLORS[place.category] }}>
              {place.category.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => { setEditForm({ ...place }); setEditing(true); }}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 text-gray-500 hover:text-white transition-all">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => toggleFavoritePlace(tripId, place.id)}
            className={`p-1.5 rounded-lg transition-all ${
              place.isFavorite ? 'text-pink-400' : 'text-gray-600 hover:text-pink-400'
            }`}>
            <Heart className={`w-4 h-4 ${place.isFavorite ? 'fill-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      {place.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{place.description}</p>
      )}

      {/* Info rows */}
      <div className="space-y-1.5 text-xs text-gray-500">
        {place.city && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {place.city}{place.address ? ` · ${place.address}` : ''}
          </div>
        )}
        {place.openingHours && (
          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{place.openingHours}</div>
        )}
        {(place.cost ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />{formatCurrency(place.cost!, currency)}
          </div>
        )}
        {place.website && (
          <a href={place.website} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
            <Globe className="w-3 h-3" /> Website
          </a>
        )}
      </div>

      {/* Rating */}
      {(place.rating ?? 0) > 0 && (
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3 h-3 ${i < place.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
          ))}
          <span className="text-xs text-gray-500 ml-1">{place.rating}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
        <button onClick={() => toggleVisitedPlace(tripId, place.id)}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            place.visited ? 'text-green-400' : 'text-gray-500 hover:text-green-400'
          }`}>
          {place.visited ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          {place.visited ? 'Visited' : 'Mark Visited'}
        </button>

        <div className="flex items-center gap-1">
          {place.lat && place.lng ? (
            <span className="flex items-center gap-1 text-xs text-indigo-400 px-1">
              <MapPin className="w-3 h-3" /> On map
            </span>
          ) : (
            <button onClick={handleLocate} disabled={locating}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 px-1 transition-colors
                         opacity-0 group-hover:opacity-100 disabled:opacity-50">
              {locating
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Navigation className="w-3 h-3" />}
              {locating ? 'Locating…' : 'Locate'}
            </button>
          )}

          <button onClick={() => deletePlace(tripId, place.id)}
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100
                       hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all capitalize border ${
        active
          ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300'
          : 'border-white/10 text-gray-500 hover:text-white'
      }`}>
      {label}
    </button>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div className={`w-9 h-5 rounded-full transition-colors relative ${value ? 'bg-indigo-600' : 'bg-white/10'}`}
        onClick={() => onChange(!value)}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </label>
  );
}

function FF({ label, value, onChange, placeholder, type = 'text', className = '' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      <input type={type} className="input-field" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}
