#!/bin/bash

echo "🔧 Starting deployment for nepalwin.space ..."

docker compose down
docker compose up -d --build --remove-orphans

echo "📡 Checking logs..."
sleep 3
docker compose logs --tail=50

echo "🚀 Deployment completed! Access your services:"
echo "Backend API: https://nepalwin.space"
echo "Frontend Spinwheel: https://spin.nepalwin.space"