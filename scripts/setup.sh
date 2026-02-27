#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "    STYX PROTOCOL: SYSTEM INITIALIZATION  "
echo "=========================================="

echo "1. Bootstrapping Database & Redis via Docker..."
make docker-up

echo "2. Installing Node Workspace Dependencies..."
make install

echo "3. Compiling Alpha-to-Omega Turborepo Architecture..."
make build

echo "4. Executing Integrated Test Matrix..."
make test

echo "=========================================="
echo "    INITIALIZATION COMPLETE. STYX IS LIVE."
echo "=========================================="
