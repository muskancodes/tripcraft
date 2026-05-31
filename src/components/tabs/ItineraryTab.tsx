import { useState } from 'react';
import { Trip, ItineraryDay, Activity, ActivityTime } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Clock, DollarSign, Check, GripVertical, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { eachDayOfInterval, parseISO, format } from 'date-fns';
import toast from 'react-hot-toast';

interface Props { trip: Trip }

const TIME_SLOTS: ActivityTime[] = ['morning', 'afternoon', 'evening', 'night', 'flexible'];
const TIME_ICONS: Record<ActivityTime, string> = {
  morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙', flexible: '⏰',
};
const TIME_COLORS: Record<ActivityTime, string> = {
  morning: 'text-orange-300',
  afternoon: 'text-yellow-300',
  evening: 'text-purple-300',
  night: 'text-indigo-300',
  flexible: 'text-gray-400',
};

export default function ItineraryTab({ trip }: Props) {
  const { addItineraryDay, deleteItineraryDay } = useTripStore();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayCity, setNewDayCity] = useState('');

  const toggleDay = (id: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGenerateDays = () => {
    if (!trip.startDate || !trip.endDate) return;
    const days = eachDayOfInterval({ start: parseISO(trip.startDate), end: parseISO(trip.endDate) });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      if (!trip.itinerary.find(d => d.date === dateStr)) {
        addItineraryDay(trip.id, { date: dateStr, city: trip.cities[0] || '', activities: [] });
      }
    });
    toast.success('Days generated');
  };

  const handleAddDay = () => {
    if (!newDayDate) { toast.error('Select a date'); return; }
    addItineraryDay(trip.id, { date: newDayDate, city: newDayCity, activities: [] });
    setNewDayDate('');
    setNewDayCity('');
    setShowAddDay(false);
    toast.success('Day added');
  };

  const sortedDays = [...trip.itinerary].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-base font-semibold text-white">Itinerary ({sortedDays.length} days)</h2>
        <div className="flex gap-2">
          {trip.itinerary.length === 0 && (
            <button onClick={handleGenerateDays} className="btn-secondary text-sm">Auto-generate Days</button>
          )}
          <button onClick={() => setShowAddDay(!showAddDay)} className="btn-primary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Day
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddDay && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="glass-card p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={newDayDate} onChange={e => setNewDayDate(e.target.value)} />
            </div>
            <div>
              <label className="label">City</label>
              <input className="input-field" placeholder="e.g. Tokyo" value={newDayCity} onChange={e => setNewDayCity(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddDay} className="btn-primary text-sm">Add</button>
              <button onClick={() => setShowAddDay(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sortedDays.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500 text-sm mb-4">No itinerary days yet</p>
          <button onClick={handleGenerateDays} className="btn-primary text-sm">Auto-generate from Trip Dates</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDays.map((day, dayIndex) => (
            <DayCard
              key={day.id}
              day={day}
              trip={trip}
              dayNumber={dayIndex + 1}
              isExpanded={expandedDays.has(day.id)}
              onToggle={() => toggleDay(day.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DayCard({ day, trip, dayNumber, isExpanded, onToggle }: {
  day: ItineraryDay; trip: Trip; dayNumber: number; isExpanded: boolean; onToggle: () => void;
}) {
  const { addActivity, deleteActivity, updateActivity, deleteItineraryDay } = useTripStore();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [actForm, setActForm] = useState({ title: '', time: 'morning' as ActivityTime, startTime: '', cost: '', location: '', notes: '' });

  const handleAddActivity = () => {
    if (!actForm.title) { toast.error('Activity title required'); return; }
    addActivity(trip.id, day.id, {
      title: actForm.title,
      time: actForm.time,
      startTime: actForm.startTime,
      location: actForm.location,
      cost: parseFloat(actForm.cost) || 0,
      notes: actForm.notes,
      completed: false,
      order: day.activities.length,
      category: 'activity',
    });
    setActForm({ title: '', time: 'morning', startTime: '', cost: '', location: '', notes: '' });
    setShowAddActivity(false);
  };

  const completedCount = day.activities.filter(a => a.completed).length;
  const totalCost = day.activities.reduce((s, a) => s + a.cost, 0);

  const byTime = TIME_SLOTS.reduce((acc, slot) => {
    const acts = day.activities.filter(a => a.time === slot);
    if (acts.length) acc[slot] = acts;
    return acc;
  }, {} as Record<ActivityTime, Activity[]>);

  return (
    <motion.div layout className="glass-card overflow-hidden">
      {/* Day header */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-xs text-indigo-400 font-bold leading-none">D{dayNumber}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white text-sm">{formatDate(day.date, 'EEEE, MMM d')}</p>
            {day.city && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />{day.city}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
            <span>{day.activities.length} activities</span>
            {completedCount > 0 && <span className="text-green-500">{completedCount} done</span>}
            {totalCost > 0 && <span>{formatCurrency(totalCost, trip.currency)}</span>}
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-white/8">
            <div className="p-4 space-y-4">
              {/* Activities by time slot */}
              {Object.entries(byTime).map(([slot, acts]) => (
                <div key={slot}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{TIME_ICONS[slot as ActivityTime]}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${TIME_COLORS[slot as ActivityTime]}`}>
                      {slot}
                    </span>
                  </div>
                  <div className="space-y-2 pl-6">
                    {acts.sort((a, b) => a.order - b.order).map(activity => (
                      <ActivityRow key={activity.id} activity={activity} tripId={trip.id} dayId={day.id} currency={trip.currency} />
                    ))}
                  </div>
                </div>
              ))}

              {day.activities.length === 0 && (
                <p className="text-sm text-gray-600 text-center py-2">No activities yet</p>
              )}

              {/* Add activity form */}
              <AnimatePresence>
                {showAddActivity && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input className="input-field" placeholder="Activity title *" value={actForm.title}
                            onChange={e => setActForm(p => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div>
                          <select className="input-field" value={actForm.time}
                            onChange={e => setActForm(p => ({ ...p, time: e.target.value as ActivityTime }))}>
                            {TIME_SLOTS.map(t => (
                              <option key={t} value={t} className="bg-surface-2 capitalize">{TIME_ICONS[t]} {t}</option>
                            ))}
                          </select>
                        </div>
                        <input type="time" className="input-field" value={actForm.startTime}
                          onChange={e => setActForm(p => ({ ...p, startTime: e.target.value }))} />
                        <input className="input-field" placeholder="Location" value={actForm.location}
                          onChange={e => setActForm(p => ({ ...p, location: e.target.value }))} />
                        <input type="number" className="input-field" placeholder={`Cost (${trip.currency})`}
                          value={actForm.cost} onChange={e => setActForm(p => ({ ...p, cost: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddActivity} className="btn-primary text-xs py-1.5">Add Activity</button>
                        <button onClick={() => setShowAddActivity(false)} className="btn-secondary text-xs py-1.5">Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between pt-2">
                <button onClick={() => setShowAddActivity(!showAddActivity)}
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                  <Plus className="w-4 h-4" /> Add Activity
                </button>
                <button onClick={() => deleteItineraryDay(trip.id, day.id)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Remove Day
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ActivityRow({ activity, tripId, dayId, currency }: {
  activity: Activity; tripId: string; dayId: string; currency: string;
}) {
  const { updateActivity, deleteActivity } = useTripStore();

  return (
    <div className={`flex items-start gap-3 p-2.5 rounded-xl group hover:bg-white/5 transition-colors ${activity.completed ? 'opacity-60' : ''}`}>
      <button
        onClick={() => updateActivity(tripId, dayId, activity.id, { completed: !activity.completed })}
        className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border transition-colors ${
          activity.completed ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-green-400'
        }`}
      >
        {activity.completed && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${activity.completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {activity.title}
        </p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          {activity.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.startTime}</span>}
          {activity.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>}
          {activity.cost > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(activity.cost, currency)}</span>}
        </div>
      </div>
      <button onClick={() => deleteActivity(tripId, dayId, activity.id)}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-gray-600 hover:text-red-400 rounded transition-all">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
