import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, LayoutDashboard, Plus, Settings, ChevronRight,
  Plane, MapPin, Users, Sparkles, X, Compass
} from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { useUIStore } from '../../store/useUIStore';
import { getTripStatus, formatDate, getStatusDot } from '../../utils/helpers';
import { useState } from 'react';
import CreateTripModal from '../trips/CreateTripModal';

export default function Sidebar() {
  const { trips } = useTripStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();

  const recentTrips = trips.slice(0, 5);

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />

            <motion.aside
              className="fixed left-0 top-0 h-full w-72 z-50 flex flex-col
                         bg-surface-2/95 backdrop-blur-xl border-r border-white/8
                         lg:relative lg:z-auto"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {/* Logo */}
              <div className="flex items-center justify-between px-5 py-5 border-b border-white/8">
                <NavLink to="/" className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
                    <Compass className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-lg leading-none">TripCraft</span>
                    <p className="text-xs text-gray-500 mt-0.5">Trip Planner</p>
                  </div>
                </NavLink>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
                <SidebarLink to="/" icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" end />
                <SidebarLink to="/trips" icon={<Globe className="w-4 h-4" />} label="All Trips" />
                <SidebarLink to="/planner" icon={<MapPin className="w-4 h-4" />} label="Explore" />

                <div className="pt-4 pb-2 px-2">
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Recent Trips</span>
                </div>

                {recentTrips.map(trip => {
                  const status = getTripStatus(trip);
                  return (
                    <button
                      key={trip.id}
                      onClick={() => navigate(`/trip/${trip.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                                 hover:bg-white/8 text-gray-300 hover:text-white transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-white/10">
                        {trip.coverImage ? (
                          <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">✈️</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{trip.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
                          <span className="text-xs text-gray-500">{formatDate(trip.startDate, 'MMM d')}</span>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                    </button>
                  );
                })}

                {trips.length === 0 && (
                  <div className="px-3 py-4 text-center">
                    <p className="text-sm text-gray-500">No trips yet</p>
                  </div>
                )}
              </nav>

              {/* Bottom section */}
              <div className="px-3 py-3 border-t border-white/8 space-y-1">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-gradient-to-r from-indigo-600/20 to-purple-600/20
                             border border-indigo-500/20 hover:border-indigo-500/40
                             text-indigo-300 hover:text-indigo-200 transition-all duration-200 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">New Trip</span>
                  <Sparkles className="w-3.5 h-3.5 ml-auto opacity-60 group-hover:opacity-100" />
                </button>

                <SidebarLink to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {showCreateModal && (
        <CreateTripModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(trip) => {
            setShowCreateModal(false);
            navigate(`/trip/${trip.id}`);
          }}
        />
      )}
    </>
  );
}

function SidebarLink({ to, icon, label, end }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium
         ${isActive
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20'
          : 'text-gray-400 hover:text-white hover:bg-white/8'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
