#!/bin/bash

echo ""
echo " ================================================"
echo "  TripCraft - Trip Planning App"
echo " ================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " [ERROR] Node.js is not installed!"
    echo " Please download and install it from: https://nodejs.org"
    echo ""
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies for the first time..."
    echo " This may take a minute."
    echo ""
    npm install || { echo " [ERROR] Failed to install dependencies."; exit 1; }
fi

# Create .env from example if it doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
fi

# Create data directory
mkdir -p data

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')

echo " -----------------------------------------------"
echo "  App running at:"
echo "    Local:   http://localhost:5174"
echo "    Network: http://$LOCAL_IP:5174"
echo ""
echo "  Share the Network address with others on"
echo "  your WiFi to let them access the app!"
echo " -----------------------------------------------"
echo ""
echo " Press Ctrl+C to stop the app."
echo ""

# Start backend in background
node server.js &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend (trap Ctrl+C to also kill backend)
trap "kill $BACKEND_PID 2>/dev/null; exit" INT
npm run dev -- --host

kill $BACKEND_PID 2>/dev/null
