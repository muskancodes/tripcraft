import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Globe, Clock, DollarSign, Users,
  ArrowRight, Calendar, MapPin, Trash2, MoreVertical
} from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { getTripStatus, formatDate, getDaysUntilTrip, getTripDuration, formatCurrency, getStatusColor, getStatusDot } from '../utils/helpers';
import CreateTripModal from '../components/trips/CreateTripModal';
import toast from 'react-hot-toast';
import CountdownWidget from '../components/dashboard/CountdownWidget';
import { Trip } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

const stagger = {
  container: { transition: { staggerChildren: 0.08 } },
  item: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
};

export default function Dashboard() {
  const { trips } = useTripStore();
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const upcomingTrips = trips.filter(t => getTripStatus(t) === 'upcoming');
  const activeTrips = trips.filter(t => getTripStatus(t) === 'active');
  const completedTrips = trips.filter(t => getTripStatus(t) === 'completed');
  const allCountries = [...new Set(trips.flatMap(t => t.countries))];
  const totalBudget = trips.reduce((sum, t) => sum + t.budget.total, 0);
  const totalSpent = trips.reduce((sum, t) => sum + t.budget.spent, 0);
  const nextTrip = upcomingTrips.sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-pink-600/10 border border-white/10 p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-noise opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌍</span>
              <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">
                Travel Dashboard
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Where to <span className="gradient-text">next?</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-md">
              {trips.length === 0
                ? "Start planning your first international adventure."
                : `You have ${upcomingTrips.length} upcoming trip${upcomingTrips.length !== 1 ? 's' : ''} and have visited ${completedTrips.length > 0 ? `${allCountries.length} countries` : 'the world awaiting'}.`
              }
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Trip
            </button>
            {trips.length > 0 && (
              <button
                onClick={() => navigate('/trips')}
                className="btn-secondary flex items-center gap-2"
              >
                All Trips
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <StatCard icon="✈️" label="Upcoming" value={upcomingTrips.length} color="indigo" delay={0} />
        <StatCard icon="🌿" label="Active" value={activeTrips.length} color="green" delay={1} />
        <StatCard icon="✅" label="Completed" value={completedTrips.length} color="gray" delay={2} />
        <StatCard icon="🌍" label="Countries" value={allCountries.length} color="purple" delay={3} />
      </motion.div>

      {/* Countdown + Budget row */}
      <div className="grid md:grid-cols-3 gap-4">
        {nextTrip && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="md:col-span-2">
            <CountdownWidget trip={nextTrip} onClick={() => navigate(`/trip/${nextTrip.id}`)} />
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="glass-card p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">Budget Overview</span>
            </div>
            <div className="space-y-3">
              <BudgetRow label="Total Budget" value={formatCurrency(totalBudget)} color="indigo" />
              <BudgetRow label="Total Spent" value={formatCurrency(totalSpent)} color="pink" />
              <BudgetRow label="Remaining" value={formatCurrency(totalBudget - totalSpent)} color="green" />
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Spend Rate</span>
                  <span>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trips section */}
      {activeTrips.length > 0 && (
        <section>
          <SectionHeader title="🌿 Active Trips" count={activeTrips.length} onViewAll={() => navigate('/trips')} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTrips.map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
            ))}
          </div>
        </section>
      )}

      {upcomingTrips.length > 0 && (
        <section>
          <SectionHeader title="✈️ Upcoming Trips" count={upcomingTrips.length} onViewAll={() => navigate('/trips')} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrips.slice(0, 6).map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
            ))}
          </div>
        </section>
      )}

      {completedTrips.length > 0 && (
        <section>
          <SectionHeader title="✅ Completed Trips" count={completedTrips.length} onViewAll={() => navigate('/trips')} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTrips.slice(0, 3).map((trip, i) => (
              <TripCard key={trip.id} trip={trip} index={i} onClick={() => navigate(`/trip/${trip.id}`)} />
            ))}
          </div>
        </section>
      )}

      {trips.length === 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🌏</div>
          <h3 className="text-xl font-semibold text-white mb-2">No trips yet</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Start planning your first international adventure. Click below to create your trip!
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" /> Plan Your First Trip
          </button>
        </motion.div>
      )}

      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(trip) => {
            setShowCreateModal(false);
            navigate(`/trip/${trip.id}`);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: { icon: string; label: string; value: number; color: string; delay: number }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-300',
    green: 'from-green-600/20 to-green-600/5 border-green-500/20 text-green-300',
    gray: 'from-gray-600/20 to-gray-600/5 border-gray-500/20 text-gray-300',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20 text-purple-300',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.08 }}
      className={`rounded-2xl bg-gradient-to-br border p-4 ${colorMap[color]}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </motion.div>
  );
}

function BudgetRow({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = { indigo: 'text-indigo-400', pink: 'text-pink-400', green: 'text-green-400' };
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-semibold ${colorMap[color]}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, count, onViewAll }: { title: string; count: number; onViewAll: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-white flex items-center gap-2">
        {title}
        <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">{count}</span>
      </h2>
      {count > 3 && (
        <button onClick={onViewAll} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          View all <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function TripCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  const { deleteTrip } = useTripStore();
  const status = getTripStatus(trip);
  const daysUntil = getDaysUntilTrip(trip.startDate);
  const duration = getTripDuration(trip.startDate, trip.endDate);
  const spentPercent = trip.budget.total > 0 ? Math.min((trip.budget.spent / trip.budget.total) * 100, 100) : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${trip.name}"?`)) return;
    deleteTrip(trip.id);
    toast.success('Trip deleted');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className="glass-card-hover overflow-hidden group relative"
    >
      {/* Delete button — top-right hover reveal */}
      <button onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm
                   text-gray-400 hover:text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100
                   transition-all border border-white/10">
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Cover */}
      <div className="relative h-40 overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
            <span className="text-5xl">✈️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`badge ${getStatusColor(status)} capitalize`}>
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
            {status}
          </span>
        </div>

        {status === 'upcoming' && daysUntil > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1">
            <span className="text-xs font-bold text-white">{daysUntil}d</span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="font-bold text-white text-base leading-tight">{trip.name}</h3>
          <p className="text-gray-300 text-xs mt-0.5">{trip.countries.join(' · ')}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(trip.startDate, 'MMM d')} – {formatDate(trip.endDate, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{duration} days</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{trip.travelers.length} traveler{trip.travelers.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{trip.cities.length} cit{trip.cities.length !== 1 ? 'ies' : 'y'}</span>
          </div>
        </div>

        {trip.budget.total > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Budget</span>
              <span className="text-gray-400">{formatCurrency(trip.budget.spent)} / {formatCurrency(trip.budget.total)}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${spentPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
