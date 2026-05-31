import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, MoreVertical, Trash2, Copy, Download, Edit3, Globe, Users, Calendar, DollarSign } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { useUIStore } from '../store/useUIStore';
import { getTripStatus, formatDate, getTripDuration, formatCurrency, getStatusColor, getStatusDot } from '../utils/helpers';
import OverviewTab from '../components/tabs/OverviewTab';
import TimelineTab from '../components/tabs/TimelineTab';
import ItineraryTab from '../components/tabs/ItineraryTab';
import BudgetTab from '../components/tabs/BudgetTab';
import HotelsTab from '../components/tabs/HotelsTab';
import FlightsTab from '../components/tabs/FlightsTab';
import TransportTab from '../components/tabs/TransportTab';
import PlacesTab from '../components/tabs/PlacesTab';
import MapsTab from '../components/tabs/MapsTab';
import GalleryTab from '../components/tabs/GalleryTab';
import DocumentsTab from '../components/tabs/DocumentsTab';
import NotesTab from '../components/tabs/NotesTab';
import EditTripModal from '../components/trips/EditTripModal';
import { downloadJSON } from '../utils/helpers';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview',  label: 'Overview' },
  { id: 'timeline',  label: 'Timeline' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'budget',    label: 'Budget' },
  { id: 'hotels',    label: 'Hotels' },
  { id: 'flights',   label: 'Flights' },
  { id: 'transport', label: 'Transport' },
  { id: 'places',    label: 'Places' },
  { id: 'maps',      label: 'Maps' },
  { id: 'gallery',   label: 'Gallery' },
  { id: 'documents', label: 'Documents' },
  { id: 'notes',     label: 'Notes' },
];

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trips, deleteTrip, duplicateTrip } = useTripStore();
  const { activeTab, setActiveTab } = useUIStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const trip = trips.find(t => t.id === id);

  // Wait for sync to load before deciding the trip doesn't exist
  useEffect(() => {
    if (!trip && trips.length > 0) navigate('/');
  }, [trip, trips.length]);

  if (!trip) return null;

  const status = getTripStatus(trip);
  const duration = getTripDuration(trip.startDate, trip.endDate);

  const handleDelete = () => {
    setMenuOpen(false);
    if (!confirm(`Delete "${trip.name}"? This cannot be undone.`)) return;
    deleteTrip(trip.id);
    navigate('/');
    toast.success('Trip deleted');
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    const newTrip = duplicateTrip(trip.id);
    navigate(`/trip/${newTrip.id}`);
    toast.success('Trip duplicated');
  };

  const handleExport = () => {
    setMenuOpen(false);
    downloadJSON(trip, `${trip.name.replace(/\s+/g, '-')}.json`);
    toast.success('Exported');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':   return <OverviewTab trip={trip} />;
      case 'timeline':   return <TimelineTab trip={trip} />;
      case 'itinerary':  return <ItineraryTab trip={trip} />;
      case 'budget':     return <BudgetTab trip={trip} />;
      case 'hotels':     return <HotelsTab trip={trip} />;
      case 'flights':    return <FlightsTab trip={trip} />;
      case 'transport':  return <TransportTab trip={trip} />;
      case 'places':     return <PlacesTab trip={trip} />;
      case 'maps':       return <MapsTab trip={trip} />;
      case 'gallery':    return <GalleryTab trip={trip} />;
      case 'documents':  return <DocumentsTab trip={trip} />;
      case 'notes':      return <NotesTab trip={trip} />;
      default:           return <OverviewTab trip={trip} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Cover + header ─────────────────────────────────────────── */}
      <div className="relative">
        {/* Cover image (own overflow-hidden so it clips the image only) */}
        <div className="h-48 md:h-56 overflow-hidden">
          {trip.coverImage
            ? <img src={trip.coverImage} alt={trip.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900" />
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
        </div>

        {/* Overlay content — NOT inside overflow-hidden so dropdowns are visible */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 md:px-6 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm
                         hover:bg-black/60 text-white text-sm transition-all border border-white/10">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 backdrop-blur-sm
                           hover:bg-black/70 text-white transition-all border border-white/20 text-sm font-medium"
              >
                <MoreVertical className="w-4 h-4" /> Options
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Close overlay */}
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-surface-3 border border-white/15
                                 rounded-xl shadow-card overflow-hidden z-20"
                    >
                      <MenuItem icon={<Edit3 className="w-4 h-4" />} label="Edit Trip"
                        onClick={() => { setMenuOpen(false); setShowEdit(true); }} />
                      <MenuItem icon={<Copy className="w-4 h-4" />} label="Duplicate Trip"
                        onClick={handleDuplicate} />
                      <MenuItem icon={<Download className="w-4 h-4" />} label="Export JSON"
                        onClick={handleExport} />
                      <div className="border-t border-white/10 my-1" />
                      <MenuItem icon={<Trash2 className="w-4 h-4" />} label="Delete Trip"
                        onClick={handleDelete} danger />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom: trip title + meta */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${getStatusColor(status)} capitalize text-xs`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(status)}`} />
                {status}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">{trip.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-300">
              <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{trip.countries.join(', ')}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(trip.startDate, 'MMM d')} – {formatDate(trip.endDate, 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{trip.travelers.length} traveller{trip.travelers.length !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{formatCurrency(trip.budget.total, trip.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="border-b border-white/8 bg-surface-1/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 flex-shrink-0
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="p-4 md:p-6 max-w-6xl mx-auto">
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {showEdit && <EditTripModal trip={trip} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
        ${danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-300 hover:text-white hover:bg-white/10'
        }`}>
      {icon} {label}
    </button>
  );
}
