import { useState } from 'react';
import { Trip, TimelineEvent, TimelineEventType } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Plane, Hotel, Activity, Bus, Bell, Edit3, Check } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const EVENT_TYPES: { type: TimelineEventType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'flight',    label: 'Flight',    icon: <Plane className="w-4 h-4" />,    color: '#6366f1' },
  { type: 'hotel',     label: 'Hotel',     icon: <Hotel className="w-4 h-4" />,    color: '#8b5cf6' },
  { type: 'activity',  label: 'Activity',  icon: <Activity className="w-4 h-4" />, color: '#f59e0b' },
  { type: 'transport', label: 'Transport', icon: <Bus className="w-4 h-4" />,      color: '#3b82f6' },
  { type: 'reminder',  label: 'Reminder',  icon: <Bell className="w-4 h-4" />,     color: '#ec4899' },
];

const EMPTY: Omit<TimelineEvent, 'id'> = {
  type: 'activity', title: '', date: '', time: '', description: '', location: '', order: 0, color: '#f59e0b',
};

export default function TimelineTab({ trip }: Props) {
  const { addTimelineEvent, deleteTimelineEvent } = useTripStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<TimelineEvent, 'id'>>(EMPTY);

  // Auto-generated events from flights, hotels, transport
  const autoEvents: TimelineEvent[] = [
    ...trip.flights.map((f, i) => ({
      id: `flight-${f.id}`,
      type: 'flight' as TimelineEventType,
      title: `${f.airline} ${f.flightNumber}`,
      date: f.departureDate,
      time: f.departureTime,
      description: `${f.departureCity} → ${f.arrivalCity}`,
      location: `${f.departureAirport} → ${f.arrivalAirport}`,
      order: i, color: '#6366f1',
    })),
    ...trip.hotels.map((h, i) => ({
      id: `hotel-in-${h.id}`,
      type: 'hotel' as TimelineEventType,
      title: `Check-in: ${h.name}`,
      date: h.checkIn, description: h.city, location: h.address, order: i, color: '#8b5cf6',
    })),
    ...trip.hotels.map((h, i) => ({
      id: `hotel-out-${h.id}`,
      type: 'hotel' as TimelineEventType,
      title: `Check-out: ${h.name}`,
      date: h.checkOut, description: h.city, location: h.address, order: i + 100, color: '#a78bfa',
    })),
    ...trip.transport.map((t, i) => ({
      id: `transport-${t.id}`,
      type: 'transport' as TimelineEventType,
      title: t.name,
      date: t.departureDate, time: t.departureTime,
      description: `${t.from} → ${t.to}`, order: i, color: '#3b82f6',
    })),
    ...trip.timelineEvents,
  ]
    .filter(e => e.date)
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));

  const grouped = autoEvents.reduce((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {} as Record<string, typeof autoEvents>);

  const handleAdd = () => {
    if (!form.title || !form.date) { toast.error('Title and date required'); return; }
    const typeInfo = EVENT_TYPES.find(e => e.type === form.type);
    addTimelineEvent(trip.id, { ...form, color: typeInfo?.color ?? '#f59e0b', order: trip.timelineEvents.length });
    setForm(EMPTY);
    setShowForm(false);
    toast.success('Event added');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Timeline ({autoEvents.length} events)</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Add Event
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Timeline Event</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <EventForm form={form} onChange={setForm} />
            <div className="flex gap-3">
              <button onClick={handleAdd} className="btn-primary text-sm">Add Event</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {autoEvents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-gray-500 text-sm">No events yet. Add flights, hotels, or transport to see them here.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[76px] top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/30 to-transparent" />
          <div className="space-y-2">
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date}>
                <div className="flex items-center gap-4 mb-3 mt-5 first:mt-0">
                  <div className="w-16 text-right">
                    <p className="text-xs font-bold text-indigo-400">{formatDate(date, 'MMM d')}</p>
                    <p className="text-xs text-gray-600">{formatDate(date, 'EEE')}</p>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-indigo-500 border-2 border-surface relative z-10 ml-[4px]" />
                  <div className="h-px flex-1 bg-white/8" />
                </div>
                {events.map((event, i) => (
                  <EventRow key={event.id} event={event} tripId={trip.id} index={i} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventRow({ event, tripId, index }: { event: TimelineEvent; tripId: string; index: number }) {
  const { deleteTimelineEvent, updateTimelineEvent } = useTripStore();
  const isAuto = event.id.startsWith('flight-') || event.id.startsWith('hotel-') || event.id.startsWith('transport-');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Omit<TimelineEvent, 'id'>>({
    type: event.type, title: event.title, date: event.date, time: event.time ?? '',
    description: event.description ?? '', location: event.location ?? '',
    order: event.order, color: event.color,
  });

  const saveEdit = () => {
    updateTimelineEvent(tripId, event.id, form);
    setEditing(false);
    toast.success('Event updated');
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      className="flex items-start gap-4 mb-2">
      <div className="w-16 text-right pt-3">
        {event.time && <p className="text-xs text-gray-500 font-mono">{event.time}</p>}
      </div>
      <div className="w-3 h-3 rounded-full border-2 border-surface mt-3.5 relative z-10 flex-shrink-0 ml-[8px]"
        style={{ backgroundColor: event.color }} />
      <div className="flex-1 ml-2">
        {editing ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <EventForm form={form} onChange={setForm} />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-primary text-xs py-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-3 border border-white/8 hover:border-white/15 transition-colors group">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white">{event.title}</p>
                {event.description && <p className="text-xs text-gray-400 mt-0.5">{event.description}</p>}
                {event.location && <p className="text-xs text-gray-600 mt-0.5">📍 {event.location}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                {!isAuto && (
                  <button onClick={() => setEditing(true)}
                    className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-indigo-400 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!isAuto && (
                  <button onClick={() => deleteTimelineEvent(tripId, event.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {isAuto && (
                  <span className="text-xs text-gray-600 px-2 py-1">auto</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EventForm({ form, onChange }: {
  form: Omit<TimelineEvent, 'id'>; onChange: (f: Omit<TimelineEvent, 'id'>) => void;
}) {
  const set = (key: keyof Omit<TimelineEvent, 'id'>, value: unknown) => onChange({ ...form, [key]: value });
  return (
    <div className="space-y-3">
      <div>
        <label className="label">Type</label>
        <div className="flex gap-2 flex-wrap">
          {EVENT_TYPES.map(et => (
            <button key={et.type} type="button" onClick={() => set('type', et.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all ${
                form.type === et.type
                  ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300'
                  : 'border-white/10 text-gray-400 hover:text-white'
              }`}>
              {et.icon} {et.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Title *</label>
          <input className="input-field" placeholder="Event title" value={form.title}
            onChange={e => set('title', e.target.value)} />
        </div>
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input-field" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div>
          <label className="label">Time</label>
          <input type="time" className="input-field" value={form.time ?? ''} onChange={e => set('time', e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input-field" placeholder="Details…" value={form.description ?? ''}
            onChange={e => set('description', e.target.value)} />
        </div>
        <div>
          <label className="label">Location</label>
          <input className="input-field" placeholder="Where?" value={form.location ?? ''}
            onChange={e => set('location', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
