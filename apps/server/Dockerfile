FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/server/package.json apps/server/
RUN cd apps/server && bun install

COPY apps/server apps/server
COPY station.json .
RUN cd apps/server && bun build src/index.ts --outdir dist --target bun

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["bun", "dist/index.js"]
