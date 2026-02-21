import { Hono } from "hono";
import { searchTrainsByNumber, fetchTrainRoute } from "../services/trainRoute";

const app = new Hono();

app.get("/search", async (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 1) {
    return c.json({ error: "Missing 'q' parameter" }, 400);
  }

  try {
    const suggestions = await searchTrainsByNumber(q.trim());
    return c.json(suggestions);
  } catch (err: any) {
    console.error("Train search error:", err);
    return c.json({ error: "Train search failed" }, 500);
  }
});

app.get("/", async (c) => {
  const trainNo = c.req.query("trainNo");
  if (!trainNo || trainNo.trim().length < 1) {
    return c.json({ error: "Missing 'trainNo' parameter" }, 400);
  }

  try {
    const result = await fetchTrainRoute(trainNo.trim());
    return c.json(result);
  } catch (err: any) {
    console.error("Train route error:", err);
    const status = err.message?.includes("not found") ? 404 : 500;
    return c.json({ error: err.message }, status);
  }
});

export default app;
