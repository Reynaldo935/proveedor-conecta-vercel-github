#!/bin/bash
trap 'echo "Received SIGHUP at $(date)" >> /home/z/my-project/signal.log' SIGHUP
trap 'echo "Received SIGINT at $(date)" >> /home/z/my-project/signal.log' SIGINT
trap 'echo "Received SIGTERM at $(date)" >> /home/z/my-project/signal.log' SIGTERM
trap 'echo "Received SIGKILL at $(date)" >> /home/z/my-project/signal.log' SIGKILL

cd /home/z/my-project
echo "[$(date)] Starting server..." >> /home/z/my-project/signal.log
exec node node_modules/next/dist/bin/next dev -p 3000
