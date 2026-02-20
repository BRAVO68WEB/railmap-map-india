import { Hono } from "hono";
import { findRoute } from "../services/route";

const app = new Hono();

app.get("/", async (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");

  if (!from || !to) {
    return c.json({ error: "Missing 'from' and 'to' station codes" }, 400);
  }

  if (from.toUpperCase() === to.toUpperCase()) {
    return c.json({ error: "Source and destination cannot be the same" }, 400);
  }

  try {
    const route = await findRoute(from, to);
    return c.json(route);
  } catch (err: any) {
    console.error("Route error:", err);
    const status = err.message?.includes("not found") ? 404 : 500;
    return c.json({ error: err.message }, status);
  }
});

export default app;
