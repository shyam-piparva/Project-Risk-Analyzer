#!/bin/bash
set -e

# This script runs during PostgreSQL initialization
# It configures authentication to allow connections from the host

echo "Configuring PostgreSQL authentication..."

# Update pg_hba.conf to allow password authentication from all hosts
cat >> "$PGDATA/pg_hba.conf" <<EOF

# Allow connections from Docker host
host    all             all             0.0.0.0/0               md5
EOF

echo "PostgreSQL authentication configured successfully"
