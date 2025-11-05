#!/bin/sh
set -e

# Check if the Node.js process is running
if pgrep -x "node" > /dev/null; then
  echo "Node.js process is running"
  exit 0
else
  echo "Node.js process is not running"
  exit 1
fi
