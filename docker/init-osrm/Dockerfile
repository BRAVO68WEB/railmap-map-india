FROM ghcr.io/project-osrm/osrm-backend:latest

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY profiles/train.lua /profiles/train.lua
COPY docker/init-osrm/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
