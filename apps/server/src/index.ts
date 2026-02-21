import { Hono } from "hono";
import { cors } from "hono/cors";
import stationRoutes from "./routes/stations";
import routeRoutes from "./routes/route";
import trainRoutes from "./routes/trains";
import trainRouteRoutes from "./routes/trainRoute";
import liveStatusRoutes from "./routes/liveStatus";

const app = new Hono();

app.use("/*", cors());

app.route("/api/stations", stationRoutes);
app.route("/api/route", routeRoutes);
app.route("/api/trains", trainRoutes);
app.route("/api/train-route", trainRouteRoutes);
app.route("/api/live-status", liveStatusRoutes);

app.get("/api/health", (c) => c.json({ status: "ok" }));

const port = parseInt(process.env.PORT || "3001");
console.log(`Server running on port ${port}`);

export default { port, fetch: app.fetch };
