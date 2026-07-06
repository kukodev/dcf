import express from "express";
import cors from "cors";
import flips from "./routes/flips";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());
app.use("/api", flips);

app.use((_req, res) => res.status(404).json({ error: "Not found", code: "NOT_FOUND" }));

app.listen(PORT, () => {
  console.log(`DCF API listening on http://localhost:${PORT}`);
});
