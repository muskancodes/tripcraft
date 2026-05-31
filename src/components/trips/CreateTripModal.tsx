import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Globe, Calendar, Users, DollarSign, Camera } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { Trip } from '../../types';
import { v4 as uuidv4 } from 'uuid';
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
  onClose: () => void;
  onCreated: (trip: Trip) => void;
}

const BUDGET_CATEGORIES = [
  { name: 'Flights', icon: '✈️', color: '#6366f1' },
  { name: 'Hotels', icon: '🏨', color: '#8b5cf6' },
  { name: 'Food', icon: '🍽️', color: '#ec4899' },
  { name: 'Activities', icon: '🎯', color: '#f59e0b' },
  { name: 'Shopping', icon: '🛍️', color: '#10b981' },
  { name: 'Local Transport', icon: '🚌', color: '#3b82f6' },
  { name: 'Visa', icon: '📋', color: '#f97316' },
  { name: 'Insurance', icon: '🛡️', color: '#14b8a6' },
  { name: 'Miscellaneous', icon: '📦', color: '#6b7280' },
];

export default function CreateTripModal({ onClose, onCreated }: Props) {
  const { addTrip } = useTripStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    description: '',
    countries: [''],
    cities: [''],
    startDate: '',
    endDate: '',
    currency: 'INR',
    coverImage: COVER_IMAGES[0],
    totalBudget: '',
    travelerNames: [''],
    notes: '',
  });

  const updateForm = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const updateArrayField = (key: 'countries' | 'cities' | 'travelerNames', index: number, value: string) => {
    const arr = [...form[key]];
    arr[index] = value;
    updateForm(key, arr);
  };

  const addArrayItem = (key: 'countries' | 'cities' | 'travelerNames') => {
    updateForm(key, [...form[key], '']);
  };

  const removeArrayItem = (key: 'countries' | 'cities' | 'travelerNames', index: number) => {
    updateForm(key, form[key].filter((_, i) => i !== index));
  };

  const handleCreate = () => {
    if (!form.name || !form.startDate || !form.endDate) {
      toast.error('Please fill in required fields');
      return;
    }

    const trip = addTrip({
      name: form.name,
      description: form.description,
      countries: form.countries.filter(Boolean),
      cities: form.cities.filter(Boolean),
      startDate: form.startDate,
      endDate: form.endDate,
      status: 'upcoming',
      currency: form.currency,
      coverImage: form.coverImage,
      notes: form.notes,
      travelers: form.travelerNames.filter(Boolean).map(name => ({
        id: uuidv4(),
        name,
      })),
      budget: {
        total: parseFloat(form.totalBudget) || 0,
        spent: 0,
        categories: BUDGET_CATEGORIES.map(cat => ({
          id: uuidv4(),
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          planned: 0,
          actual: 0,
        })),
      },
      flights: [],
      hotels: [],
      transport: [],
      itinerary: [],
      places: [],
      documents: [],
      gallery: [],
      mapPins: [],
      tripNotes: [],
      packingList: [],
      timelineEvents: [],
      emergencyContacts: [],
    });

    toast.success(`"${trip.name}" created!`);
    onCreated(trip);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="relative w-full max-w-2xl bg-surface-2 border border-white/10 rounded-2xl
                   shadow-card overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div>
            <h2 className="text-lg font-semibold text-white">Create New Trip</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5 px-6 py-3 border-b border-white/8">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-indigo-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="label">Trip Name *</label>
                <input
                  className="input-field"
                  placeholder="e.g. Japan Cherry Blossom Adventure"
                  value={form.name}
                  onChange={e => updateForm('name', e.target.value)}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  placeholder="A brief description of your trip..."
                  value={form.description}
                  onChange={e => updateForm('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.startDate}
                    onChange={e => updateForm('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">End Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.endDate}
                    onChange={e => updateForm('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Countries</label>
                <div className="space-y-2">
                  {form.countries.map((country, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        placeholder="e.g. Japan"
                        value={country}
                        onChange={e => updateArrayField('countries', i, e.target.value)}
                      />
                      {form.countries.length > 1 && (
                        <button onClick={() => removeArrayItem('countries', i)}
                          className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addArrayItem('countries')}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors px-1">
                    <Plus className="w-4 h-4" /> Add Country
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Cities</label>
                <div className="space-y-2">
                  {form.cities.map((city, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        placeholder="e.g. Tokyo"
                        value={city}
                        onChange={e => updateArrayField('cities', i, e.target.value)}
                      />
                      {form.cities.length > 1 && (
                        <button onClick={() => removeArrayItem('cities', i)}
                          className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addArrayItem('cities')}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors px-1">
                    <Plus className="w-4 h-4" /> Add City
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="label">Travelers</label>
                <div className="space-y-2">
                  {form.travelerNames.map((name, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="input-field flex-1"
                        placeholder={`Traveler ${i + 1} name`}
                        value={name}
                        onChange={e => updateArrayField('travelerNames', i, e.target.value)}
                      />
                      {form.travelerNames.length > 1 && (
                        <button onClick={() => removeArrayItem('travelerNames', i)}
                          className="p-2.5 rounded-xl hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => addArrayItem('travelerNames')}
                    className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors px-1">
                    <Plus className="w-4 h-4" /> Add Traveler
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input-field"
                    value={form.currency}
                    onChange={e => updateForm('currency', e.target.value)}
                  >
                    {CURRENCY_RATES.map(c => (
                      <option key={c.code} value={c.code} className="bg-surface-2">
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Total Budget</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 5000"
                    value={form.totalBudget}
                    onChange={e => updateForm('totalBudget', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Any important notes or reminders..."
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div>
                <label className="label">Cover Image</label>
                <div className="grid grid-cols-4 gap-2">
                  {COVER_IMAGES.map(img => (
                    <button
                      key={img}
                      onClick={() => updateForm('coverImage', img)}
                      className={`aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                        form.coverImage === img ? 'border-indigo-500 scale-105' : 'border-transparent hover:border-white/30'
                      }`}
                    >
                      <img src={img} alt="cover" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Or enter a custom image URL:</p>
                <input
                  className="input-field mt-1"
                  placeholder="https://..."
                  value={form.coverImage.startsWith('http') ? form.coverImage : ''}
                  onChange={e => updateForm('coverImage', e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-white/10 h-32 relative">
                <img src={form.coverImage} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-white font-bold text-lg">{form.name || 'Your Trip'}</p>
                  <p className="text-gray-300 text-sm">{form.countries.filter(Boolean).join(', ') || 'Destinations'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/8">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="btn-secondary text-sm"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary text-sm"
            >
              Continue
            </button>
          ) : (
            <button onClick={handleCreate} className="btn-primary text-sm">
              Create Trip ✨
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
