import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import flips from "./routes/flips";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", flips);
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found", code: "NOT_FOUND" }));

if (process.env.NODE_ENV === "production") {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.use((_req, res) => res.status(404).json({ error: "Not found", code: "NOT_FOUND" }));

app.listen(PORT, () => {
  console.log(`DCF listening on http://localhost:${PORT}`);
});
