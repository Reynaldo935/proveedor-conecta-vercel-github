#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..." >> /home/z/my-project/dev.log
  node node_modules/next/dist/bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] Server exited with code $EXIT, restarting in 5s..." >> /home/z/my-project/dev.log
  sleep 5
done
