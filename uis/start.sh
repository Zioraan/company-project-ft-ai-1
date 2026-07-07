#!/bin/sh
cd /app/website && npm run dev -- -p 3000 -H 0.0.0.0 &
cd /app/backoffice && npm run dev -- -p 3001 -H 0.0.0.0 &
wait
