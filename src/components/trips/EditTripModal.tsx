import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { Trip } from '../../types';
import { CURRENCY_RATES } from '../../data/sampleData';
import toast from 'react-hot-toast';

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80',
  'https://images.unsplash.com/photo-1538970272646-f61fabb3a8a2?w=800&q=80',
  'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=800&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
  'https://images.unsplash.com/photo-1467803738586-46b7eb7b16a1?w=800&q=80',
  'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
];

interface Props {
  trip: Trip;
  onClose: () => void;
}

export default function EditTripModal({ trip, onClose }: Props) {
  const { updateTrip } = useTripStore();

  const [form, setForm] = useState({
    name: trip.name,
    description: trip.description ?? '',
    countries: trip.countries.length ? [...trip.countries] : [''],
    cities: trip.cities.length ? [...trip.cities] : [''],
    startDate: trip.startDate,
    endDate: trip.endDate,
    currency: trip.currency,
    coverImage: trip.coverImage ?? COVER_IMAGES[0],
    notes: trip.notes ?? '',
    travelerNames: trip.travelers.map(t => t.name),
    totalBudget: trip.budget.total.toString(),
    status: trip.status,
  });

  const set = (key: string, value: unknown) => setForm(p => ({ ...p, [key]: value }));

  const updateArr = (key: 'countries' | 'cities' | 'travelerNames', i: number, v: string) => {
    const arr = [...form[key]]; arr[i] = v; set(key, arr);
  };
  const addArr = (key: 'countries' | 'cities' | 'travelerNames') => set(key, [...form[key], '']);
  const removeArr = (key: 'countries' | 'cities' | 'travelerNames', i: number) =>
    set(key, form[key].filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Name and dates are required'); return;
    }
    updateTrip(trip.id, {
      name: form.name,
      description: form.description,
      countries: form.countries.filter(Boolean),
      cities: form.cities.filter(Boolean),
      startDate: form.startDate,
      endDate: form.endDate,
      currency: form.currency,
      coverImage: form.coverImage,
      notes: form.notes,
      status: form.status,
      travelers: form.travelerNames.filter(Boolean).map((name, i) => ({
        id: trip.travelers[i]?.id ?? name,
        name,
      })),
      budget: {
        ...trip.budget,
        total: parseFloat(form.totalBudget) || trip.budget.total,
      },
    });
    toast.success('Trip updated');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />

      <motion.div
        className="relative w-full max-w-2xl bg-surface-2 border border-white/10 rounded-2xl
                   shadow-card overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-lg font-semibold text-white">Edit Trip</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Basic info */}
          <div className="space-y-3">
            <FF label="Trip Name *" value={form.name} onChange={v => set('name', v)} />
            <div>
              <label className="label">Description</label>
              <textarea className="input-field resize-none" rows={2} value={form.description}
                onChange={e => set('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FF label="Start Date *" type="date" value={form.startDate} onChange={v => set('startDate', v)} />
              <FF label="End Date *" type="date" value={form.endDate} onChange={v => set('endDate', v)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select className="input-field" value={form.status}
                  onChange={e => set('status', e.target.value)}>
                  <option value="planning" className="bg-surface-2">Planning</option>
                  <option value="upcoming" className="bg-surface-2">Upcoming</option>
                  <option value="active" className="bg-surface-2">Active</option>
                  <option value="completed" className="bg-surface-2">Completed</option>
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input-field" value={form.currency}
                  onChange={e => set('currency', e.target.value)}>
                  {CURRENCY_RATES.map(c => (
                    <option key={c.code} value={c.code} className="bg-surface-2">{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FF label="Total Budget" type="number" value={form.totalBudget}
                onChange={v => set('totalBudget', v)} placeholder="e.g. 80000" />
            </div>
          </div>

          {/* Countries */}
          <div>
            <label className="label">Countries</label>
            <div className="space-y-2">
              {form.countries.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field flex-1" placeholder="e.g. Japan" value={c}
                    onChange={e => updateArr('countries', i, e.target.value)} />
                  {form.countries.length > 1 && (
                    <button onClick={() => removeArr('countries', i)}
                      className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArr('countries')}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 px-1 transition-colors">
                <Plus className="w-4 h-4" /> Add Country
              </button>
            </div>
          </div>

          {/* Cities */}
          <div>
            <label className="label">Cities</label>
            <div className="space-y-2">
              {form.cities.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field flex-1" placeholder="e.g. Tokyo" value={c}
                    onChange={e => updateArr('cities', i, e.target.value)} />
                  {form.cities.length > 1 && (
                    <button onClick={() => removeArr('cities', i)}
                      className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArr('cities')}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 px-1 transition-colors">
                <Plus className="w-4 h-4" /> Add City
              </button>
            </div>
          </div>

          {/* Travelers */}
          <div>
            <label className="label">Travelers</label>
            <div className="space-y-2">
              {form.travelerNames.map((name, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field flex-1" placeholder={`Traveler ${i + 1}`} value={name}
                    onChange={e => updateArr('travelerNames', i, e.target.value)} />
                  {form.travelerNames.length > 1 && (
                    <button onClick={() => removeArr('travelerNames', i)}
                      className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => addArr('travelerNames')}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 px-1 transition-colors">
                <Plus className="w-4 h-4" /> Add Traveler
              </button>
            </div>
          </div>

          {/* Cover image */}
          <div>
            <label className="label">Cover Image</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {COVER_IMAGES.map(img => (
                <button key={img} onClick={() => set('coverImage', img)}
                  className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                    form.coverImage === img ? 'border-indigo-500 scale-105' : 'border-transparent hover:border-white/30'
                  }`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <input className="input-field" placeholder="Or paste custom image URL…"
              value={COVER_IMAGES.includes(form.coverImage) ? '' : form.coverImage}
              onChange={e => set('coverImage', e.target.value)} />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes}
              onChange={e => set('notes', e.target.value)} placeholder="Any important notes…" />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button onClick={handleSave} className="btn-primary text-sm">Save Changes</button>
        </div>
      </motion.div>
    </div>
  );
}

function FF({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input-field" placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}
