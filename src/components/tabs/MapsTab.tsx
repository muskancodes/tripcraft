import { useState, useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Trip, MapPin, Place, PlaceCategory } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, MapPin as MapPinIcon, Layers } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../utils/helpers';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix default leaflet icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createCustomIcon = (color: string, emoji: string) =>
  L.divIcon({
    html: `<div style="
      width:36px;height:36px;background:${color};
      border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;">
      <div style="transform:rotate(45deg);font-size:14px;margin-top:2px">${emoji}</div>
    </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });

const CATEGORIES: PlaceCategory[] = ['attraction','restaurant','hotel','shopping','hidden_gem','park','beach','other'];

interface Props { trip: Trip }

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function MapFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (points.length === 0) return;
    // Only refit when the number of points changes (new place added)
    if (points.length === prevCountRef.current) return;
    prevCountRef.current = points.length;

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else {
      map.fitBounds(points.map(p => p as L.LatLngTuple), { padding: [40, 40] });
    }
  }, [points.length]);

  return null;
}

type LayerMode = 'pins' | 'places' | 'both';

export default function MapsTab({ trip }: Props) {
  const { addMapPin, deleteMapPin } = useTripStore();
  const [addingPin, setAddingPin] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pinForm, setPinForm] = useState({ title: '', description: '', category: 'attraction' as PlaceCategory });
  const [filterCat, setFilterCat] = useState<PlaceCategory | 'all'>('all');
  const [layer, setLayer] = useState<LayerMode>('both');

  // Places that have coordinates
  const placesWithCoords = trip.places.filter(p => p.lat != null && p.lng != null);

  const center: [number, number] = (() => {
    if (trip.mapPins.length > 0) return [trip.mapPins[0].lat, trip.mapPins[0].lng];
    if (placesWithCoords.length > 0) return [placesWithCoords[0].lat!, placesWithCoords[0].lng!];
    return [20, 78]; // default: India
  })();

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (addingPin) setPendingPin({ lat, lng });
  }, [addingPin]);

  const handleSavePin = () => {
    if (!pendingPin || !pinForm.title) { toast.error('Click map then enter a title'); return; }
    addMapPin(trip.id, {
      ...pendingPin,
      title: pinForm.title,
      description: pinForm.description,
      category: pinForm.category,
      color: CATEGORY_COLORS[pinForm.category],
    });
    setPendingPin(null);
    setPinForm({ title: '', description: '', category: 'attraction' });
    setAddingPin(false);
    toast.success('Pin added');
  };

  const filteredPins = trip.mapPins.filter(p => filterCat === 'all' || p.category === filterCat);
  const filteredPlaces = placesWithCoords.filter(p => filterCat === 'all' || p.category === filterCat);

  const totalMarkers =
    (layer === 'pins' || layer === 'both' ? filteredPins.length : 0) +
    (layer === 'places' || layer === 'both' ? filteredPlaces.length : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white">
          Map <span className="text-sm font-normal text-gray-500">({totalMarkers} markers)</span>
        </h2>
        <div className="flex gap-2">
          {/* Layer toggle */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
            {(['both','pins','places'] as LayerMode[]).map(l => (
              <button key={l} onClick={() => setLayer(l)}
                className={`px-2.5 py-1.5 rounded-lg capitalize transition-colors ${
                  layer === l ? 'bg-indigo-600/40 text-indigo-300' : 'text-gray-500 hover:text-white'
                }`}>
                {l === 'both' ? 'All' : l}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setAddingPin(!addingPin); setPendingPin(null); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              addingPin
                ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}>
            <MapPinIcon className="w-4 h-4" />
            {addingPin ? 'Click map…' : 'Add Pin'}
          </button>
        </div>
      </div>

      {/* Note about places */}
      {placesWithCoords.length === 0 && trip.places.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <Layers className="w-3.5 h-3.5 flex-shrink-0" />
          {trip.places.length} saved place{trip.places.length > 1 ? 's' : ''} — add coordinates in the Places tab to show them here automatically.
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1.5 flex-wrap">
        <FilterBtn label="All" active={filterCat === 'all'} onClick={() => setFilterCat('all')} />
        {CATEGORIES.filter(c =>
          trip.mapPins.some(p => p.category === c) || placesWithCoords.some(p => p.category === c)
        ).map(cat => (
          <FilterBtn key={cat} label={`${CATEGORY_ICONS[cat]} ${cat.replace('_',' ')}`}
            active={filterCat === cat} onClick={() => setFilterCat(cat)} />
        ))}
      </div>

      {/* Pin form */}
      <AnimatePresence>
        {addingPin && pendingPin && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 space-y-3">
            <p className="text-xs text-green-400">
              📍 Pin at {pendingPin.lat.toFixed(4)}, {pendingPin.lng.toFixed(4)}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Title *</label>
                <input className="input-field" placeholder="Pin title" value={pinForm.title}
                  onChange={e => setPinForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input-field" placeholder="Details" value={pinForm.description}
                  onChange={e => setPinForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={pinForm.category}
                  onChange={e => setPinForm(p => ({ ...p, category: e.target.value as PlaceCategory }))}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-surface-2 capitalize">
                      {CATEGORY_ICONS[c]} {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSavePin} className="btn-primary text-sm">Save Pin</button>
              <button onClick={() => { setPendingPin(null); setAddingPin(false); }} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div className={`rounded-2xl overflow-hidden border border-white/10 relative ${addingPin ? 'cursor-crosshair' : ''}`}
        style={{ height: 480 }}>
        <MapContainer center={center} zoom={trip.mapPins.length > 0 || placesWithCoords.length > 0 ? 10 : 5}
          style={{ height: '100%', width: '100%' }} zoomControl>
          <TileLayer
            attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapFitBounds points={[
            ...trip.mapPins.map(p => [p.lat, p.lng] as [number, number]),
            ...placesWithCoords.map(p => [p.lat!, p.lng!] as [number, number]),
          ]} />

          {pendingPin && (
            <Marker position={[pendingPin.lat, pendingPin.lng]}>
              <Popup>New pin here</Popup>
            </Marker>
          )}

          {/* Manual pins */}
          {(layer === 'pins' || layer === 'both') && filteredPins.map(pin => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}
              icon={createCustomIcon(pin.color, CATEGORY_ICONS[pin.category])}>
              <Popup>
                <div className="font-sans" style={{ minWidth: 160 }}>
                  <p className="font-bold text-sm mb-1">{pin.title}</p>
                  {pin.description && <p className="text-xs text-gray-600 mb-2">{pin.description}</p>}
                  <p className="text-xs capitalize" style={{ color: pin.color }}>
                    {CATEGORY_ICONS[pin.category]} {pin.category.replace('_', ' ')}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Places with coordinates */}
          {(layer === 'places' || layer === 'both') && filteredPlaces.map(place => (
            <Marker key={place.id} position={[place.lat!, place.lng!]}
              icon={createCustomIcon(CATEGORY_COLORS[place.category], CATEGORY_ICONS[place.category])}>
              <Popup>
                <div className="font-sans" style={{ minWidth: 160 }}>
                  <p className="font-bold text-sm mb-1">{place.name}</p>
                  {place.description && <p className="text-xs text-gray-600 mb-1">{place.description}</p>}
                  {place.address && <p className="text-xs text-gray-500 mb-2">📍 {place.address}</p>}
                  <p className="text-xs capitalize" style={{ color: CATEGORY_COLORS[place.category] }}>
                    {CATEGORY_ICONS[place.category]} {place.category.replace('_', ' ')}
                    {place.rating ? ` · ⭐ ${place.rating}` : ''}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {addingPin && !pendingPin && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm
                          text-white text-sm px-4 py-2 rounded-xl border border-white/20 pointer-events-none z-[1000]">
            🖱️ Click anywhere on the map to place a pin
          </div>
        )}
      </div>

      {/* Saved pins list */}
      {filteredPins.length > 0 && (layer === 'pins' || layer === 'both') && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Manual Pins <span className="text-xs font-normal text-gray-500">({filteredPins.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredPins.map(pin => (
              <PinRow key={pin.id} label={pin.title} sublabel={pin.category.replace('_',' ')}
                color={pin.color} icon={CATEGORY_ICONS[pin.category]}
                onDelete={() => deleteMapPin(trip.id, pin.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Places on map list */}
      {filteredPlaces.length > 0 && (layer === 'places' || layer === 'both') && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Places (from Places tab) <span className="text-xs font-normal text-gray-500">({filteredPlaces.length})</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredPlaces.map(place => (
              <PinRow key={place.id} label={place.name} sublabel={`${place.city} · ${place.category.replace('_',' ')}`}
                color={CATEGORY_COLORS[place.category]} icon={CATEGORY_ICONS[place.category]} />
            ))}
          </div>
        </div>
      )}

      {totalMarkers === 0 && (
        <div className="glass-card p-10 text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 text-sm">No markers yet.</p>
          <p className="text-gray-600 text-xs mt-1">Add manual pins above, or add coordinates to saved places.</p>
        </div>
      )}
    </div>
  );
}

function PinRow({ label, sublabel, color, icon, onDelete }: {
  label: string; sublabel: string; color: string; icon: string; onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{label}</p>
        <p className="text-xs text-gray-500 capitalize">{sublabel}</p>
      </div>
      {onDelete && (
        <button onClick={onDelete}
          className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all capitalize ${
        active ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' : 'border-white/10 text-gray-500 hover:text-white'
      }`}>
      {label}
    </button>
  );
}
