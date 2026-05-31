import { useState } from 'react';
import { Trip, Flight } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Plane, Trash2, Edit3, ChevronDown, Check } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const EMPTY: Omit<Flight, 'id'> = {
  airline: '', flightNumber: '', departureAirport: '', departureCity: '', departureDate: '',
  departureTime: '', arrivalAirport: '', arrivalCity: '', arrivalDate: '', arrivalTime: '',
  terminal: '', seat: '', bookingRef: '', cost: 0, class: 'economy', status: 'confirmed', notes: '',
};

export default function FlightsTab({ trip }: Props) {
  const { addFlight, deleteFlight } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Flight, 'id'>>(EMPTY);

  const handleAdd = () => {
    if (!form.airline || !form.flightNumber) { toast.error('Airline and flight number required'); return; }
    addFlight(trip.id, form);
    setForm(EMPTY);
    setShowForm(false);
    toast.success('Flight added');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Flights ({trip.flights.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Flight
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Flight</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <FlightForm form={form} onChange={setForm} currency={trip.currency} />
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Add Flight</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {trip.flights.length === 0 ? (
          <EmptyState icon="✈️" label="No flights added yet" />
        ) : (
          trip.flights.map((f, i) => (
            <FlightCard key={f.id} flight={f} tripId={trip.id} currency={trip.currency} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

function FlightCard({ flight, tripId, currency, index }: {
  flight: Flight; tripId: string; currency: string; index: number;
}) {
  const { deleteFlight, updateFlight } = useTripStore();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<Flight, 'id'>>({ ...flight });

  const saveEdit = () => {
    updateFlight(tripId, flight.id, form);
    setEditing(false);
    toast.success('Flight updated');
  };

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/20',
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="glass-card overflow-hidden">
      {editing ? (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Edit Flight</h3>
            <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <FlightForm form={form} onChange={setForm} currency={currency} />
          <div className="flex gap-3">
            <button onClick={saveEdit} className="btn-primary text-sm flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Save Changes
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{flight.departureAirport}</p>
                  <p className="text-xs text-gray-400">{flight.departureCity}</p>
                  <p className="text-sm font-medium text-indigo-400">{flight.departureTime}</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="flex items-center gap-1 w-full">
                    <div className="flex-1 h-px bg-white/20" />
                    <Plane className="w-4 h-4 text-indigo-400" />
                    <div className="flex-1 h-px bg-white/20" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{flight.airline} · {flight.flightNumber}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-white">{flight.arrivalAirport}</p>
                  <p className="text-xs text-gray-400">{flight.arrivalCity}</p>
                  <p className="text-sm font-medium text-indigo-400">{flight.arrivalTime}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-gray-500">{formatDate(flight.departureDate)}</span>
                <span className={`badge border ${statusColors[flight.status]} capitalize`}>{flight.status}</span>
                <span className="capitalize text-gray-500">{flight.class}</span>
                {flight.seat && <span className="text-gray-500">Seat {flight.seat}</span>}
                {flight.bookingRef && <span className="font-mono text-gray-400">{flight.bookingRef}</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <p className="text-sm font-semibold text-white">{formatCurrency(flight.cost, currency)}</p>
              <div className="flex gap-1">
                <button onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-indigo-400 transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => setExpanded(!expanded)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 transition-colors">
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={() => deleteFlight(tripId, flight.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-white/8 pt-3 mt-3 grid grid-cols-2 gap-2 text-xs">
                {flight.terminal && <InfoRow label="Terminal" value={flight.terminal} />}
                {flight.arrivalDate && <InfoRow label="Arrival Date" value={formatDate(flight.arrivalDate)} />}
                {flight.notes && <div className="col-span-2"><InfoRow label="Notes" value={flight.notes} /></div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

function FlightForm({ form, onChange, currency }: {
  form: Omit<Flight, 'id'>; onChange: (f: Omit<Flight, 'id'>) => void; currency: string;
}) {
  const set = (key: keyof Omit<Flight, 'id'>, value: string | number) =>
    onChange({ ...form, [key]: value });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <FF label="Airline *" value={form.airline} onChange={v => set('airline', v)} placeholder="Japan Airlines" />
      <FF label="Flight No. *" value={form.flightNumber} onChange={v => set('flightNumber', v)} placeholder="JL061" />
      <FF label="Booking Ref" value={form.bookingRef} onChange={v => set('bookingRef', v)} placeholder="ABC123" />
      <FF label="Dep. Airport" value={form.departureAirport} onChange={v => set('departureAirport', v)} placeholder="BOM" />
      <FF label="Dep. City" value={form.departureCity} onChange={v => set('departureCity', v)} placeholder="Mumbai" />
      <FF label="Dep. Date" type="date" value={form.departureDate} onChange={v => set('departureDate', v)} />
      <FF label="Dep. Time" type="time" value={form.departureTime} onChange={v => set('departureTime', v)} />
      <FF label="Arr. Airport" value={form.arrivalAirport} onChange={v => set('arrivalAirport', v)} placeholder="NRT" />
      <FF label="Arr. City" value={form.arrivalCity} onChange={v => set('arrivalCity', v)} placeholder="Tokyo" />
      <FF label="Arr. Date" type="date" value={form.arrivalDate} onChange={v => set('arrivalDate', v)} />
      <FF label="Arr. Time" type="time" value={form.arrivalTime} onChange={v => set('arrivalTime', v)} />
      <FF label="Terminal" value={form.terminal ?? ''} onChange={v => set('terminal', v)} placeholder="T2" />
      <FF label="Seat" value={form.seat ?? ''} onChange={v => set('seat', v)} placeholder="24A" />
      <div>
        <label className="label">Cost ({currency})</label>
        <input type="number" className="input-field" value={form.cost}
          onChange={e => set('cost', parseFloat(e.target.value) || 0)} />
      </div>
      <div>
        <label className="label">Class</label>
        <select className="input-field" value={form.class}
          onChange={e => set('class', e.target.value as Flight['class'])}>
          <option value="economy" className="bg-surface-2">Economy</option>
          <option value="business" className="bg-surface-2">Business</option>
          <option value="first" className="bg-surface-2">First Class</option>
        </select>
      </div>
      <div>
        <label className="label">Status</label>
        <select className="input-field" value={form.status}
          onChange={e => set('status', e.target.value as Flight['status'])}>
          <option value="confirmed" className="bg-surface-2">Confirmed</option>
          <option value="pending" className="bg-surface-2">Pending</option>
          <option value="cancelled" className="bg-surface-2">Cancelled</option>
        </select>
      </div>
      <div className="col-span-2 md:col-span-3">
        <label className="label">Notes</label>
        <textarea className="input-field resize-none" rows={2} value={form.notes ?? ''}
          onChange={e => set('notes', e.target.value)} placeholder="Meal preference, baggage…" />
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div><span className="text-gray-500">{label}: </span><span className="text-gray-300">{value}</span></div>;
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="glass-card p-12 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  );
}
