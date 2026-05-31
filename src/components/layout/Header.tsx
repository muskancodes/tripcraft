import { Menu, Sun, Moon, Bell, Sparkles, Search } from 'lucide-react';
import { useUIStore } from '../../store/useUIStore';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../../store/useTripStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { isDarkMode, toggleDarkMode, toggleSidebar, toggleAIPanel } = useUIStore();
  const { trips } = useTripStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const searchResults = searchQuery.length > 1
    ? trips.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.countries.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3
                       bg-surface-1/80 backdrop-blur-xl border-b border-white/8">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {title && (
        <div className="hidden sm:block">
          <h1 className="text-base font-semibold text-white leading-none">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            className="relative"
          >
            <input
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
              placeholder="Search trips..."
              className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 pr-9
                         text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-surface-3 border border-white/10
                              rounded-xl shadow-card overflow-hidden z-50">
                {searchResults.map(trip => (
                  <button
                    key={trip.id}
                    onMouseDown={() => { navigate(`/trip/${trip.id}`); setSearchOpen(false); setSearchQuery(''); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 transition-colors text-left"
                  >
                    <span className="text-lg">✈️</span>
                    <div>
                      <p className="text-sm text-white font-medium">{trip.name}</p>
                      <p className="text-xs text-gray-500">{trip.countries.join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        )}
      </div>

      {/* AI Assistant toggle */}
      <button
        onClick={toggleAIPanel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                   bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20
                   text-indigo-300 hover:text-indigo-200 hover:border-indigo-500/40
                   text-sm font-medium transition-all duration-200"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">AI</span>
      </button>

      <button
        className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all relative"
      >
        <Bell className="w-4.5 h-4.5" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
      </button>

      <button
        onClick={toggleDarkMode}
        className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
      >
        {isDarkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
      </button>

      {actions}
    </header>
  );
}
