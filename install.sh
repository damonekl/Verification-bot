#!/bin/bash
set -e
apt update -y
apt upgrade -y
apt install -y curl git build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
fi
npm install -g pm2
npm install
