#!/usr/bin/env bash
set -euo pipefail

case "$(uname -m)" in
  aarch64|arm64) arch=arm64 ;;
  x86_64|amd64) arch=x64 ;;
  *)
    echo "unsupported architecture: $(uname -m)" >&2
    exit 1
    ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  apt-get update
  apt-get install -y curl ca-certificates
fi

mkdir -p /opt/node
curl -fsSL "https://nodejs.org/dist/v22.23.3/node-v22.23.3-linux-${arch}.tar.gz" | tar -xz -C /opt/node --strip-components=1
export PATH="/opt/node/bin:${PATH}"
hash -r
echo "Using $(node -v)"
npm ci --include=dev --include=optional
npm run build
