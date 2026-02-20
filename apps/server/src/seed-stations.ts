import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/railway_map";

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();

  console.log("==> Enabling pg_trgm extension...");
  await client.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
  await client.query("CREATE EXTENSION IF NOT EXISTS postgis;");

  console.log("==> Creating stations table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS stations (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      geom GEOMETRY(Point, 4326),
      matched_osm_name VARCHAR(255),
      match_confidence FLOAT
    );
  `);

  // Load station.json
  const stationPath = new URL("../../../station.json", import.meta.url).pathname;
  const stations: { code: string; name: string }[] = await Bun.file(stationPath).json();

  console.log(`==> Inserting ${stations.length} stations...`);

  // Batch insert using VALUES
  const batchSize = 500;
  for (let i = 0; i < stations.length; i += batchSize) {
    const batch = stations.slice(i, i + batchSize);
    const values: string[] = [];
    const params: string[] = [];

    batch.forEach((s, idx) => {
      const offset = idx * 2;
      values.push(`($${offset + 1}, $${offset + 2})`);
      params.push(s.code, s.name);
    });

    await client.query(
      `INSERT INTO stations (code, name) VALUES ${values.join(", ")}
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
      params
    );

    console.log(`   Inserted ${Math.min(i + batchSize, stations.length)} / ${stations.length}`);
  }

  console.log("==> Stations seeded successfully.");
  await client.end();
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
