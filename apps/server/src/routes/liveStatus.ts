import { Hono } from "hono";
import { fetchLiveStatus } from "../services/liveStatus";

const app = new Hono();

app.get("/", async (c) => {
  const trainNo = c.req.query("trainNo");
  if (!trainNo || trainNo.trim().length < 1) {
    return c.json({ error: "Missing 'trainNo' parameter" }, 400);
  }

  const date = c.req.query("date"); // optional, YYYY-MM-DD

  try {
    const result = await fetchLiveStatus(trainNo.trim(), date || undefined);
    return c.json(result);
  } catch (err: any) {
    console.error("Live status error:", err);
    const status = err.message?.includes("not found") ? 404 : 500;
    return c.json({ error: err.message }, status);
  }
});

export default app;
