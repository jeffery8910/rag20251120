FROM mcr.microsoft.com/devcontainers/javascript-node:20

# 可在此安裝額外系統相依性（必要時）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git && \
    rm -rf /var/lib/apt/lists/*

