#!/bin/bash
cd /home/z/my-project
echo "[$(date)] Starting ProveedorConecta dev daemon..." >> /home/z/my-project/dev.log
while true; do
  node node_modules/next/dist/bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] Server exited ($EXIT), restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
done
