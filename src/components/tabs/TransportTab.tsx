import { useState } from 'react';
import { Trip, Transport, TransportType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, ArrowRight, Clock, Edit3, Check } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate, formatCurrency, TRANSPORT_ICONS } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props { trip: Trip }
const TYPES: TransportType[] = ['train', 'bus', 'ferry', 'taxi', 'rental', 'metro', 'tram', 'other'];
const EMPTY: Omit<Transport, 'id'> = {
  type: 'train', name: '', from: '', to: '', departureDate: '',
  departureTime: '', arrivalTime: '', cost: 0, duration: '',
  bookingRef: '', notes: '', status: 'confirmed',
};

export default function TransportTab({ trip }: Props) {
  const { addTransport } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Transport, 'id'>>(EMPTY);

  const handleAdd = () => {
    if (!form.name || !form.from || !form.to) { toast.error('Name, from, and to required'); return; }
    addTransport(trip.id, form);
    setForm(EMPTY);
    setShowForm(false);
    toast.success('Transport added');
  };

  const grouped = TYPES.reduce((acc, type) => {
    const items = trip.transport.filter(t => t.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {} as Record<string, Transport[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Transport ({trip.transport.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Transport
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Transport</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <TransportForm form={form} onChange={setForm} currency={trip.currency} />
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Add Transport</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {trip.transport.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">🚌</div><p className="text-gray-500 text-sm">No transport added yet</p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h3 className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3">
              <span>{TRANSPORT_ICONS[type]}</span>
              <span className="capitalize">{type}</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-500">{items.length}</span>
            </h3>
            <div className="space-y-3">
              {items.map((t, i) => <TransportCard key={t.id} transport={t} tripId={trip.id} currency={trip.currency} index={i} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TransportCard({ transport, tripId, currency, index }: {
  transport: Transport; tripId: string; currency: string; index: number;
}) {
  const { deleteTransport, updateTransport } = useTripStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<Transport, 'id'>>({ ...transport });

  const saveEdit = () => {
    updateTransport(tripId, transport.id, form);
    setEditing(false);
    toast.success('Transport updated');
  };

  const statusColors: Record<string, string> = {
    confirmed: 'text-green-400 bg-green-400/10',
    pending: 'text-yellow-400 bg-yellow-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  if (editing) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Edit Transport</h3>
          <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <TransportForm form={form} onChange={setForm} currency={currency} />
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
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
      className="glass-card p-4 flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
        {TRANSPORT_ICONS[transport.type]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-white text-sm">{transport.name}</span>
          <span className={`badge text-xs ${statusColors[transport.status]} capitalize`}>{transport.status}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="font-medium text-gray-300">{transport.from}</span>
          <ArrowRight className="w-3 h-3" />
          <span className="font-medium text-gray-300">{transport.to}</span>
          {transport.departureDate && <span>· {formatDate(transport.departureDate, 'MMM d')}</span>}
          {transport.departureTime && <span>· {transport.departureTime}</span>}
          {transport.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{transport.duration}</span>}
        </div>
        {transport.notes && <p className="text-xs text-gray-600 mt-1">{transport.notes}</p>}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-white">{formatCurrency(transport.cost, currency)}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-indigo-400 transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteTransport(tripId, transport.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TransportForm({ form, onChange, currency }: {
  form: Omit<Transport, 'id'>; onChange: (t: Omit<Transport, 'id'>) => void; currency: string;
}) {
  const set = (key: keyof Omit<Transport, 'id'>, value: unknown) => onChange({ ...form, [key]: value });
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Type</label>
        <div className="flex gap-2 flex-wrap">
          {(['train','bus','ferry','taxi','rental','metro','tram','other'] as TransportType[]).map(t => (
            <button key={t} onClick={() => set('type', t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                form.type === t
                  ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-300'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}>
              {TRANSPORT_ICONS[t]} <span className="capitalize">{t}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="col-span-2 md:col-span-1">
          <FF label="Name / Route" value={form.name} onChange={v => set('name', v)} placeholder="Shinkansen Nozomi" />
        </div>
        <FF label="From" value={form.from} onChange={v => set('from', v)} placeholder="Mumbai" />
        <FF label="To" value={form.to} onChange={v => set('to', v)} placeholder="Pune" />
        <FF label="Date" type="date" value={form.departureDate} onChange={v => set('departureDate', v)} />
        <FF label="Dep. Time" type="time" value={form.departureTime} onChange={v => set('departureTime', v)} />
        <FF label="Arr. Time" type="time" value={form.arrivalTime ?? ''} onChange={v => set('arrivalTime', v)} />
        <FF label="Duration" value={form.duration ?? ''} onChange={v => set('duration', v)} placeholder="2h 15m" />
        <div>
          <label className="label">Cost ({currency})</label>
          <input type="number" className="input-field" value={form.cost}
            onChange={e => set('cost', parseFloat(e.target.value) || 0)} />
        </div>
        <FF label="Booking Ref" value={form.bookingRef ?? ''} onChange={v => set('bookingRef', v)} placeholder="Optional" />
        <div>
          <label className="label">Status</label>
          <select className="input-field" value={form.status}
            onChange={e => set('status', e.target.value as Transport['status'])}>
            <option value="confirmed" className="bg-surface-2">Confirmed</option>
            <option value="pending" className="bg-surface-2">Pending</option>
            <option value="cancelled" className="bg-surface-2">Cancelled</option>
          </select>
        </div>
        <div className="col-span-2 md:col-span-3">
          <label className="label">Notes</label>
          <textarea className="input-field resize-none" rows={2} value={form.notes ?? ''}
            onChange={e => set('notes', e.target.value)} placeholder="Platform, luggage policy…" />
        </div>
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
