FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    postgresql-client \
    curl \
    jq \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy application files
COPY apps/server/package.json /init/apps/server/package.json
COPY apps/server/src/seed-stations.ts /init/apps/server/src/seed-stations.ts
COPY station.json /init/station.json
COPY scripts/match-stations.sql /init/scripts/match-stations.sql

# Install dependencies for seed script
WORKDIR /init/apps/server
RUN bun install --production

COPY docker/init-db/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /init
ENTRYPOINT ["/entrypoint.sh"]
