import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Grid3X3, List, Globe, Calendar, Users, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTripStore } from '../store/useTripStore';
import { getTripStatus, formatDate, getTripDuration, formatCurrency, getStatusColor, getStatusDot, getDaysUntilTrip } from '../utils/helpers';
import CreateTripModal from '../components/trips/CreateTripModal';
import { Trip } from '../types';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'upcoming' | 'active' | 'completed' | 'planning';

export default function AllTrips() {
  const { trips } = useTripStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = trips
    .filter(t => filter === 'all' || getTripStatus(t) === filter)
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.countries.some(c => c.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">All Trips</h1>
          <p className="text-sm text-gray-500 mt-0.5">{trips.length} trip{trips.length !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Trip
        </button>
      </div>

      {/* Filters & search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input className="input-field pl-9" placeholder="Search trips..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'upcoming', 'completed', 'planning'] as FilterStatus[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all capitalize ${
                filter === f ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300' : 'border-white/10 text-gray-500 hover:text-white'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          <button onClick={() => setView('grid')}
            className={`p-1.5 rounded-lg transition-colors ${view === 'grid' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={`p-1.5 rounded-lg transition-colors ${view === 'list' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-3">✈️</div>
          <p className="text-gray-500 text-sm">
            {search ? 'No trips match your search' : 'No trips yet. Create your first one!'}
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((trip, i) => (
            <TripGridCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trip, i) => (
            <TripListRow key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onCreated={trip => { setShowCreate(false); navigate(`/trip/${trip.id}`); }}
        />
      )}
    </div>
  );
}

function TripGridCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const { deleteTrip } = useTripStore();
  const status = getTripStatus(trip);
  const duration = getTripDuration(trip.startDate, trip.endDate);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.name}"?`)) return;
    deleteTrip(trip.id);
    toast.success('Trip deleted');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onClick={onClick} className="glass-card-hover overflow-hidden group relative">
      {/* Delete */}
      <button onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm
                   text-gray-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100
                   transition-all border border-white/10">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
      <div className="relative h-36 overflow-hidden">
        {trip.coverImage
          ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-4xl">✈️</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <span className={`absolute top-3 left-3 badge ${getStatusColor(status)} capitalize text-xs`}>
          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />{status}
        </span>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-white leading-tight">{trip.name}</h3>
          <p className="text-gray-300 text-xs">{trip.countries.join(' · ')}</p>
        </div>
      </div>
      <div className="p-4 grid grid-cols-3 gap-2 text-xs text-gray-400">
        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(trip.startDate, 'MMM d')}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{duration}d</span>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{trip.travelers.length}</span>
      </div>
    </motion.div>
  );
}

function TripListRow({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const { deleteTrip } = useTripStore();
  const status = getTripStatus(trip);
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const daysUntil = getDaysUntilTrip(trip.startDate);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.name}"?`)) return;
    deleteTrip(trip.id);
    toast.success('Trip deleted');
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04 }}
      onClick={onClick} className="glass-card-hover flex items-center gap-4 p-4 group">
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        {trip.coverImage
          ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-xl">✈️</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white truncate">{trip.name}</h3>
          <span className={`badge ${getStatusColor(status)} capitalize text-xs flex-shrink-0`}>{status}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{trip.countries.join(', ')}</span>
          <span>{formatDate(trip.startDate, 'MMM d')} – {formatDate(trip.endDate, 'MMM d, yyyy')}</span>
          <span>{duration} days</span>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {status === 'upcoming' && daysUntil > 0 && (
          <p className="text-sm font-bold text-indigo-400">{daysUntil}d away</p>
        )}
        {trip.budget.total > 0 && (
          <p className="text-xs text-gray-500">{formatCurrency(trip.budget.total, trip.currency)}</p>
        )}
      </div>
      <button onClick={handleDelete}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10
                   text-gray-500 hover:text-red-400 transition-all flex-shrink-0">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
