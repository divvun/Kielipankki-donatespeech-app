#!/bin/bash
# Generate OpenAPI specification from running backend

set -e

echo "Generating OpenAPI specification..."

# Check if backend is running
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "Error: Backend is not running at http://localhost:8000"
    echo "Please start it first with: ./setup-local.sh"
    exit 1
fi

# Fetch OpenAPI spec
curl http://localhost:8000/openapi.json | uv run python -m json.tool > openapi.json

echo "✓ Generated openapi.json ($(wc -c < openapi.json | tr -d ' ') bytes)"
