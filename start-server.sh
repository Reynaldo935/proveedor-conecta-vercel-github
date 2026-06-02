#!/bin/bash
cd /home/z/my-project/.next/standalone
while true; do
  PORT=3000 node server.js
  echo "Server crashed, restarting in 3s..."
  sleep 3
done
