# 🚂 Railway Map India

Growing up, I spent countless hours poring over thick railway atlases — those beautiful, hefty books filled with coloured route lines snaking across the map of India, each station name a tiny doorway to a place I dreamed of visiting. There's something magical about tracing a route with your finger from Delhi to Kanyakumari and imagining the landscapes rolling past the window. Train journeys in India aren't just travel — they're an experience of chai at dawn, bridges over rivers you can't name, and stations that smell of pakoras. This project is my attempt to bring that joy of discovery to the browser — an interactive railway map where you can explore 35,000+ stations, find routes, and relive the romance of Indian Railways. 🚃✨

## ✨ Features

- 🗺️ Interactive map with grayscale basemap + OpenRailwayMap overlay
- 🔍 Search stations with fuzzy matching (35,000+ Indian railway stations)
- 🛤️ Route visualization between any two stations
- 📅 Train schedule lookup via RailYatri + eRail
- 🎛️ Layer controls (CartoDB Positron, OSM, Railway Infrastructure)

## 🏗️ Tech Stack

- **Frontend:** React 19, Leaflet, Tailwind CSS, Vite
- **Backend:** Bun, Hono, PostgreSQL/PostGIS
- **Routing:** OSRM with custom `train.lua` profile
- **Infrastructure:** Docker, Nginx, Turbo monorepo

## 📋 Prerequisites

- Docker & Docker Compose
- [Bun](https://bun.sh) (v1.3+)
- `osmium-tool`, GDAL (`ogr2ogr`)
- India OSM PBF file from [Geofabrik](https://download.geofabrik.de/asia/india.html)
- HOT OSM railway GeoJSON exports from [HDX](https://data.humdata.org/)

## 🚀 Quick Start (Development)

```bash
# Clone and install
git clone https://github.com/bravo68web/railway-map.git
cd railway-map
bun install

# Download required data files into the project root:
#   - india-latest.osm.pbf from Geofabrik
#   - hotosm_ind_railways_lines_geojson.zip from HDX
#   - hotosm_ind_railways_points_geojson.zip from HDX
#   - station.json (Indian railway station list)

# Run full first-time setup (extract data, build OSRM, seed DB)
bun run init

# Start dev servers (API on :3001, client on :5173)
bun run dev
```

## 🐳 Docker (Production)

The production setup is fully self-bootstrapping — just run `docker compose up`:

```bash
docker compose up -d
```

On first run, two init containers automatically:
- **init-osrm**: Downloads the India PBF (~200MB) from Geofabrik and builds the OSRM routing graph
- **init-db**: Downloads HOT OSM railway data from HDX, imports GeoJSON into PostGIS, seeds 35,000+ stations, and runs fuzzy matching

The first run takes **30-60+ minutes** depending on your internet speed and CPU (OSRM graph build is the bottleneck). Subsequent runs start in seconds — init containers detect existing data and skip.

Services exposed:
- **Client:** `http://localhost:80` (nginx reverse-proxies `/api` to the server)

> **Note:** No host tools required — all data processing happens inside Docker containers.

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `bun run init` | Full first-time setup (extract data, build OSRM graph, seed DB) |
| `bun run dev` | Start dev servers (Turbo monorepo) |
| `bun run build` | Build both apps for production |
| `bun run seed` | Seed station data into PostgreSQL |
| `docker compose up` | Production startup (auto-bootstraps everything) |

## 📁 Project Structure

```
railway-map/
├── apps/
│   ├── client/          # React frontend (Vite + Leaflet + Tailwind)
│   └── server/          # Bun + Hono API server
├── profiles/
│   └── train.lua        # Custom OSRM routing profile for railways
├── scripts/
│   ├── init.sh          # Full dev environment setup
│   ├── startup.sh       # Production startup & DB migration
│   └── match-stations.sql  # Fuzzy matching stations to OSM data
├── docker-compose.yml       # Production (GHCR images)
├── docker-compose.dev.yml   # Development (builds from source)
├── station.json             # Indian railway station dataset
├── train.json               # Train schedule dataset
└── turbo.json               # Turborepo config
```

## 🗺️ Map Layers

| Layer | Description |
|-------|-------------|
| **CartoDB Positron** | Clean grayscale basemap — default layer, lets railway lines pop |
| **OpenStreetMap** | Full-detail fallback map with roads, labels, and landmarks |
| **OpenRailwayMap** | Specialized overlay showing tracks, signals, stations, and infrastructure |

## 🔗 Data Sources & Attribution

- [OpenStreetMap](https://www.openstreetmap.org/) — map tiles and geodata
- [CARTO](https://carto.com/) — CartoDB Positron basemap tiles
- [OpenRailwayMap](https://www.openrailwaymap.org/) — railway infrastructure overlay
- [Indian Railways (RBS)](https://rbs.indianrail.gov.in/) — station codes and metadata
- [RailYatri](https://www.railyatri.in/) — train schedules and live status
- [eRail.in](https://erail.in/) — train route and schedule data
- [HOT OSM / HDX](https://data.humdata.org/) — railway GeoJSON exports for India

## 📄 License

This project is for personal and educational use. Map data is subject to the respective licenses of OpenStreetMap, CARTO, and OpenRailwayMap contributors.
