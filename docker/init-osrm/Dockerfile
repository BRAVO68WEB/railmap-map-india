FROM ghcr.io/project-osrm/osrm-backend:latest

RUN apk add --no-cache curl ca-certificates

COPY profiles/train.lua /profiles/train.lua
COPY docker/init-osrm/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
