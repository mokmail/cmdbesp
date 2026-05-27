#!/bin/sh
set -e

UPLOADS_DIR="/app/uploads"
UPLOADS_ID_DIR="/app/uploads/ID_generated"
BUILTIN_DIR="/usr/share/nginx/html/uploads"
BUILTIN_ID_DIR="/usr/share/nginx/html/uploads/ID_generated"

mkdir -p "$UPLOADS_DIR" "$UPLOADS_ID_DIR"

if [ -d "$BUILTIN_DIR" ]; then
  for f in "$BUILTIN_DIR"/*.csv; do
    [ -f "$f" ] && [ ! -f "$UPLOADS_DIR/$(basename "$f")" ] && cp "$f" "$UPLOADS_DIR/"
  done
fi

if [ -d "$BUILTIN_ID_DIR" ]; then
  for f in "$BUILTIN_ID_DIR"/*.csv; do
    [ -f "$f" ] && [ ! -f "$UPLOADS_ID_DIR/$(basename "$f")" ] && cp "$f" "$UPLOADS_ID_DIR/"
  done
fi

echo "Starting API server on port 3001..."
node /app/server.js &

echo "Starting nginx on port 4455..."
nginx -g 'daemon off;'