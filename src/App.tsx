import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import TripDetail from './pages/TripDetail';
import AllTrips from './pages/AllTrips';
import Settings from './pages/Settings';
import { initSync } from './services/syncService';
import { useTripStore } from './store/useTripStore';

function SyncBootstrap() {
  useEffect(() => {
    initSync((serverTrips) => {
      // Only replace local state if server has more/newer trips (multi-device sync)
      const local = useTripStore.getState().trips;
      if (serverTrips.length >= local.length) {
        useTripStore.setState({ trips: serverTrips });
      }
    }).then((initialTrips) => {
      // On startup: prefer whichever source has more data
      if (initialTrips.length > useTripStore.getState().trips.length) {
        useTripStore.setState({ trips: initialTrips });
      }
    });
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SyncBootstrap />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e1e35',
            color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#1e1e35' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e1e35' } },
          duration: 3000,
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="trips" element={<AllTrips />} />
          <Route path="trip/:id" element={<TripDetail />} />
          <Route path="settings" element={<Settings />} />
          <Route path="planner" element={<Dashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
