FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/client/package.json apps/client/
RUN cd apps/client && bun install

COPY apps/client apps/client
RUN cd apps/client && bun run build

FROM nginx:alpine
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
