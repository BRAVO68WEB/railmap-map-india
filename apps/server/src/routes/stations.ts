import { Hono } from "hono";
import { searchStations } from "../services/stations";

const app = new Hono();

app.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.length < 2) {
    return c.json([]);
  }

  try {
    const stations = await searchStations(q);
    return c.json(stations);
  } catch (err) {
    console.error("Station search error:", err);
    return c.json({ error: "Search failed" }, 500);
  }
});

export default app;
