# dxos-agent/Dockerfile

FROM node:22-slim

WORKDIR /app

# Install Python + build tools for node-gyp
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean

# Install DXOS CLI
RUN npm install -g @dxos/cli

# Optionally expose agent port (adjust if needed)
EXPOSE 4040

# Start the agent
COPY entrypoint.sh /app/entrypoint.sh
CMD ["/app/entrypoint.sh"]
