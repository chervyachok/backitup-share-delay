#!/bin/bash

# Start the DXOS agent
dx agent start &

# Keep the container alive
tail -f /dev/null
