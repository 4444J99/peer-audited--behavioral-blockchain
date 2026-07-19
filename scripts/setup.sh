#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "    STYX PROTOCOL: SYSTEM INITIALIZATION  "
echo "=========================================="

echo "0. Verifying infrastructure tooling..."
if ! command -v terraform &> /dev/null; then
    echo "Downloading Terraform 1.9.0..."
    curl -fsSL https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/').zip -o tf.zip
    unzip tf.zip -d /usr/local/bin/ || unzip tf.zip -d .
    rm tf.zip
fi

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
