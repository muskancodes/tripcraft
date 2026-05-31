# TripCraft — International Trip Planner

## Quick Setup

### 1. Install Node.js (Required)

Download and install Node.js v18+ from: https://nodejs.org/en/download
- Choose the **LTS version** (recommended)
- During installation, check "Add to PATH"
- Restart your terminal after installation

### 2. Install Dependencies

Open a terminal in this folder (`Trip Planning`) and run:

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app opens at **http://localhost:5173**

### 4. Build for Production

```bash
npm run build
npm run preview
```

---

## Project Architecture

```
src/
├── components/
│   ├── ai/           — AI chatbot assistant
│   ├── dashboard/    — Dashboard widgets
│   ├── features/     — Reusable features (currency, packing)
│   ├── layout/       — App shell (Sidebar, Header, Layout)
│   └── tabs/         — Trip detail tabs (12 total)
│       ├── OverviewTab.tsx
│       ├── TimelineTab.tsx
│       ├── ItineraryTab.tsx
│       ├── BudgetTab.tsx
│       ├── HotelsTab.tsx
│       ├── FlightsTab.tsx
│       ├── TransportTab.tsx
│       ├── PlacesTab.tsx
│       ├── MapsTab.tsx
│       ├── GalleryTab.tsx
│       ├── DocumentsTab.tsx
│       └── NotesTab.tsx
├── data/
│   └── sampleData.ts — Sample trips, currencies, country info
├── pages/
│   ├── Dashboard.tsx — Main dashboard
│   ├── TripDetail.tsx — Trip detail page with tabs
│   ├── AllTrips.tsx  — Trip listing
│   └── Settings.tsx  — App settings
├── store/
│   ├── useTripStore.ts — Zustand store for trips (persisted)
│   └── useUIStore.ts   — Zustand store for UI state
├── types/
│   └── index.ts      — All TypeScript types
└── utils/
    └── helpers.ts    — Utility functions
```

## Key Technology Choices

| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | Core framework with type safety |
| Vite | Fast build tooling |
| Tailwind CSS | Utility-first styling |
| Zustand + persist | State management with localStorage |
| Framer Motion | Smooth animations |
| React Router v6 | Client-side routing |
| Recharts | Budget charts |
| React Leaflet | Interactive maps |
| react-hot-toast | Notifications |
| date-fns | Date utilities |
| Lucide React | Icon library |
| uuid | Unique IDs |

## Future API Integrations

### AI Assistant
Replace mock responses in `src/components/ai/AIAssistant.tsx`:
```typescript
// services/aiService.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

### Live Currency Rates
Replace `CURRENCY_RATES` in `sampleData.ts`:
```typescript
// services/currencyService.ts
const response = await fetch(`https://openexchangerates.org/api/latest.json?app_id=${API_KEY}`);
```

### Google Maps
Replace Leaflet in `MapsTab.tsx`:
```typescript
import { GoogleMap, Marker } from '@react-google-maps/api';
```

### Flight Search
```typescript
// services/flightService.ts  
const response = await fetch(`https://api.skyscanner.com/apiservices/...`);
```

## PWA Support (Bonus)

To enable PWA, install `vite-plugin-pwa` and add to `vite.config.ts`:
```bash
npm install vite-plugin-pwa
```

## Export Features

- **Export to JSON**: Settings > Export All Data
- **Export itinerary to PDF**: Add `jsPDF` + `html2canvas` to BudgetTab
- **Export budget to Excel**: Add `xlsx` package

## Multi-user Collaboration Architecture

For multi-user support, add:
1. Authentication: Supabase Auth / Firebase Auth
2. Database: Supabase (PostgreSQL) / Firebase Firestore
3. Real-time: Supabase Realtime / Firebase listeners
4. Conflict resolution: Operational Transform or CRDTs
