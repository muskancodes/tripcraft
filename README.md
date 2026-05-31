# ✈️ TripCraft

A beautiful, self-hostable trip planning app. Plan trips, track budgets, manage itineraries, save places on a map, and more.

## Quick Start

### Requirements
- [Node.js](https://nodejs.org) v18 or higher

### Windows
Double-click `start.bat`

### Mac / Linux
```bash
chmod +x start.sh
./start.sh
```

The app opens at **http://localhost:5174**. Everyone on your WiFi can access it at the **Network** address shown in the terminal.

---

## Features

- 🗺️ Interactive maps with place pins
- 📅 Day-by-day itinerary planner
- 💰 Budget tracker
- 🏨 Hotels, flights & transport management
- 📍 Places with autocomplete search (OpenStreetMap)
- 🌙 Dark / light mode
- 📱 Works as a mobile app (add to home screen)
- 🤖 AI travel assistant (optional — requires Claude API key)

---

## AI Features (Optional)

AI is disabled by default. To enable:

1. Get a free API key at [console.anthropic.com](https://console.anthropic.com)
2. Open **Settings** in the app and enter your API key
3. AI features activate immediately — no restart needed

---

## Data Storage

All your trip data is saved locally in `data/state.json`. Back this file up to keep your trips safe.

---

## Use on your phone

1. Start the app and note the **Network** address (e.g. `http://192.168.1.5:5174`)
2. Open that URL in your phone's browser (must be on same WiFi)
3. Tap **Share → Add to Home Screen** to install it as an app

---

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Clean community version — download and run locally |
| `personal` | Personal hosted version (private deployment) |
