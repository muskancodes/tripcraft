import { useState } from 'react';
import { Trip, Hotel } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Star, MapPin, Calendar, ExternalLink, Trash2, Phone, Edit3, Check } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { differenceInDays, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const EMPTY: Omit<Hotel, 'id'> = {
  name: '', address: '', city: '', checkIn: '', checkOut: '',
  cost: 0, bookingRef: '', bookingLink: '', rating: 4,
  roomType: '', amenities: [], notes: '', phone: '',
};

export default function HotelsTab({ trip }: Props) {
  const { addHotel } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Hotel, 'id'>>(EMPTY);

  const handleAdd = () => {
    if (!form.name || !form.city) { toast.error('Hotel name and city required'); return; }
    addHotel(trip.id, form);
    setForm(EMPTY);
    setShowForm(false);
    toast.success('Hotel added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Hotels ({trip.hotels.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Hotel
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Hotel</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <HotelForm form={form} onChange={setForm} currency={trip.currency} />
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Add Hotel</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        {trip.hotels.length === 0 ? (
          <div className="md:col-span-2 glass-card p-12 text-center">
            <div className="text-5xl mb-3">🏨</div>
            <p className="text-gray-500 text-sm">No hotels added yet</p>
          </div>
        ) : (
          trip.hotels.map((h, i) => <HotelCard key={h.id} hotel={h} tripId={trip.id} currency={trip.currency} index={i} />)
        )}
      </div>
    </div>
  );
}

function HotelCard({ hotel, tripId, currency, index }: {
  hotel: Hotel; tripId: string; currency: string; index: number;
}) {
  const { deleteHotel, updateHotel } = useTripStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<Hotel, 'id'>>({ ...hotel });

  const nights = hotel.checkIn && hotel.checkOut
    ? differenceInDays(parseISO(hotel.checkOut), parseISO(hotel.checkIn))
    : 0;
  const total = hotel.cost * Math.max(nights, 1);

  const saveEdit = () => {
    updateHotel(tripId, hotel.id, form);
    setEditing(false);
    toast.success('Hotel updated');
  };

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 space-y-4 md:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Edit Hotel</h3>
          <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <HotelForm form={form} onChange={setForm} currency={currency} />
        <div className="flex gap-3">
          <button onClick={saveEdit} className="btn-primary text-sm flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Save Changes
          </button>
          <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.06 }}
      className="glass-card p-5 relative group">
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-indigo-400 transition-colors">
          <Edit3 className="w-4 h-4" />
        </button>
        <button onClick={() => deleteHotel(tripId, hotel.id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-xl">🏨</div>
        <div className="flex-1 min-w-0 pr-12">
          <h3 className="font-semibold text-white">{hotel.name}</h3>
          <div className="flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-400">{hotel.city}</span></div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 ${i < hotel.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
        ))}
        {hotel.roomType && <span className="text-xs text-gray-500 ml-2">{hotel.roomType}</span>}
      </div>

      <div className="space-y-2 text-xs text-gray-400">
        {(hotel.checkIn || hotel.checkOut) && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{hotel.checkIn ? formatDate(hotel.checkIn) : '—'} → {hotel.checkOut ? formatDate(hotel.checkOut) : '—'}</span>
            {nights > 0 && <span className="text-gray-600">({nights} nights)</span>}
          </div>
        )}
        {hotel.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{hotel.address}</span></div>}
        {hotel.phone && <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /><a href={`tel:${hotel.phone}`} className="hover:text-white">{hotel.phone}</a></div>}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/8">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-sm font-semibold text-white">{formatCurrency(total, currency)}</p>
        </div>
        <div className="flex items-center gap-2">
          {hotel.bookingRef && <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">{hotel.bookingRef}</span>}
          {hotel.bookingLink && (
            <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      {hotel.notes && <p className="mt-2 text-xs text-gray-500 italic">{hotel.notes}</p>}
    </motion.div>
  );
}

function HotelForm({ form, onChange, currency }: {
  form: Omit<Hotel, 'id'>; onChange: (h: Omit<Hotel, 'id'>) => void; currency: string;
}) {
  const set = (key: keyof Omit<Hotel, 'id'>, value: unknown) => onChange({ ...form, [key]: value });
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div className="col-span-2 md:col-span-1"><FF label="Hotel Name *" value={form.name} onChange={v => set('name', v)} placeholder="Park Hyatt" /></div>
      <FF label="City *" value={form.city} onChange={v => set('city', v)} placeholder="Tokyo" />
      <FF label="Address" value={form.address} onChange={v => set('address', v)} placeholder="Full address" />
      <FF label="Check-in" type="date" value={form.checkIn} onChange={v => set('checkIn', v)} />
      <FF label="Check-out" type="date" value={form.checkOut} onChange={v => set('checkOut', v)} />
      <div>
        <label className="label">Cost per night ({currency})</label>
        <input type="number" className="input-field" value={form.cost}
          onChange={e => set('cost', parseFloat(e.target.value) || 0)} />
      </div>
      <FF label="Booking Ref" value={form.bookingRef ?? ''} onChange={v => set('bookingRef', v)} placeholder="ABC123" />
      <FF label="Booking Link" value={form.bookingLink ?? ''} onChange={v => set('bookingLink', v)} placeholder="https://…" />
      <FF label="Room Type" value={form.roomType ?? ''} onChange={v => set('roomType', v)} placeholder="Deluxe King" />
      <FF label="Phone" value={form.phone ?? ''} onChange={v => set('phone', v)} placeholder="+81-3-…" />
      <div>
        <label className="label">Rating</label>
        <div className="flex items-center gap-1 py-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => set('rating', i + 1)}>
              <Star className={`w-5 h-5 transition-colors ${i < form.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-2 md:col-span-3">
        <label className="label">Notes</label>
        <textarea className="input-field resize-none" rows={2} value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)} placeholder="Special requests…" />
      </div>
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
