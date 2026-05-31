import { motion } from 'framer-motion';
import { Sun, Moon, Trash2, Download, Shield, Globe, Bell } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useTripStore } from '../store/useTripStore';
import { downloadJSON } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function Settings() {
  const { isDarkMode, toggleDarkMode } = useUIStore();
  const { trips } = useTripStore();

  const exportAll = () => {
    downloadJSON({ trips, exportedAt: new Date().toISOString() }, 'tripcraft-export.json');
    toast.success('Data exported');
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-white">Settings</h1>

      <Section title="Appearance" icon={<Sun className="w-4 h-4 text-yellow-400" />}>
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div>
            <p className="text-sm font-medium text-white">Dark Mode</p>
            <p className="text-xs text-gray-500">Use dark theme throughout the app</p>
          </div>
          <button onClick={toggleDarkMode}
            className={`w-11 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-white/20'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow ${isDarkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </Section>

      <Section title="Data & Privacy" icon={<Shield className="w-4 h-4 text-green-400" />}>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-sm font-medium text-white">Export All Data</p>
              <p className="text-xs text-gray-500">Download all trips as JSON ({trips.length} trips)</p>
            </div>
            <button onClick={exportAll} className="btn-secondary text-sm flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-sm font-medium text-white mb-1">Local Storage</p>
            <p className="text-xs text-gray-500">
              All data is stored locally in your browser using IndexedDB/localStorage.
              No data is sent to any server. Clear browser data to reset.
            </p>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-sm font-medium text-yellow-300 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security Notice
            </p>
            <p className="text-xs text-yellow-400/80 mt-2 leading-relaxed">
              Do not store sensitive documents (passport copies, visa documents) in this application
              in production environments without implementing proper encryption (AES-256 minimum).
              This demo stores data unencrypted in browser storage.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Future Integrations" icon={<Globe className="w-4 h-4 text-blue-400" />}>
        <div className="space-y-3">
          {[
            { name: 'OpenAI / Claude API', desc: 'AI travel assistant with GPT-4 or Claude', status: 'Planned', icon: '🤖' },
            { name: 'Google Maps API', desc: 'Interactive maps with directions', status: 'Planned', icon: '🗺️' },
            { name: 'Skyscanner API', desc: 'Real-time flight search', status: 'Planned', icon: '✈️' },
            { name: 'Booking.com API', desc: 'Hotel search and prices', status: 'Planned', icon: '🏨' },
            { name: 'Open Exchange Rates', desc: 'Live currency exchange rates', status: 'Planned', icon: '💱' },
            { name: 'OpenWeatherMap', desc: 'Destination weather forecasts', status: 'Planned', icon: '🌤️' },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{item.name}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-lg">{item.status}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="About" icon={<Bell className="w-4 h-4 text-indigo-400" />}>
        <div className="p-4 bg-white/5 rounded-xl space-y-2">
          <p className="text-sm text-white font-medium">TripCraft v1.0.0</p>
          <p className="text-xs text-gray-500">International Trip Planner</p>
          <p className="text-xs text-gray-600 mt-2">Built with React + TypeScript + Vite + Tailwind CSS</p>
          <p className="text-xs text-gray-600">Zustand · Framer Motion · Recharts · Leaflet · React Router</p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
      <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        {icon} {title}
      </h2>
      {children}
    </motion.div>
  );
}
