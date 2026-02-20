import { Hono } from "hono";
import { searchTrains } from "../services/trains";

const app = new Hono();

app.get("/", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!from || !to) {
    return c.json({ error: "Missing 'from' and 'to' station codes" }, 400);
  }

  try {
    const trains = await searchTrains(from, to);
    return c.json({ trains });
  } catch (err: any) {
    console.error("Train search error:", err);
    return c.json({ trains: [] });
  }
});

export default app;
