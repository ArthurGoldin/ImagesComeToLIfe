#!/bin/bash
# Simple HTTP server to run the Images Come to Life project
# This resolves CORS issues when loading local files

PORT=8000

echo "Starting HTTP server on http://localhost:$PORT"
echo "Press Ctrl+C to stop the server"
echo ""
echo "Open your browser and navigate to:"
echo "  http://localhost:$PORT"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
# Fallback to Python 2
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
# Try using npx http-server if available
elif command -v npx &> /dev/null; then
    npx http-server -p $PORT
else
    echo "Error: No suitable HTTP server found."
    echo "Please install Python or Node.js to run this server."
    exit 1
fi
