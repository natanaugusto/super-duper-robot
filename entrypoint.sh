#!/bin/bash

set -e

echo "Install node dependencies..."
npm i --verbose

echo "Running prisma migrate dev..."
npm run migrate

echo "Starting Node.js application..."
npm run start

echo "Application started successfully!"