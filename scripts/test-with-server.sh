#!/bin/bash

# Start the Vite dev server in the background
echo "Starting development server..."
npm run dev > /dev/null 2>&1 &
DEV_SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Server is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Error: Server failed to start within 30 seconds"
    kill $DEV_SERVER_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Run the tests
echo "Running tests..."
npm run test:run-only

# Capture the test exit code
TEST_EXIT_CODE=$?

# Kill the dev server
echo "Shutting down development server..."
kill $DEV_SERVER_PID 2>/dev/null

# Exit with the test exit code
exit $TEST_EXIT_CODE
