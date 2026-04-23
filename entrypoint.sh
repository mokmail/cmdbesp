#!/bin/sh
set -e

echo "Starting API server on port 3001..."
node /app/server.js &

echo "Starting Streamlit dashboard on port 8501..."
streamlit run /app/dashboard.py \
  --server.port 8501 \
  --server.headless true \
  --server.enableCORS false \
  --server.enableXsrfProtection false \
  --browser.gatherUsageStats false &

echo "Starting nginx on port 80..."
nginx -g 'daemon off;'