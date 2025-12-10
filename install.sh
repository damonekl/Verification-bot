#!/bin/bash

echo "🔧 Instaluju systémové knihovny (canvas)…"
apt update
apt install -y python3 build-essential libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev librsvg2-dev

echo "📦 Instaluju NPM balíčky…"
npm install

echo "✨ Bot je připraven!"
