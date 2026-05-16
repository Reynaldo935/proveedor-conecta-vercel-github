#!/bin/bash
# Double-fork to fully detach from terminal
cd /home/z/my-project
(
  while true; do
    node node_modules/next/dist/bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
    echo "[$(date)] Server died, restarting in 5s..." >> /home/z/my-project/dev.log
    sleep 5
  done
) &
