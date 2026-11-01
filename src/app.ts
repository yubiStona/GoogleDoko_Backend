import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";

import routes from "./routes";
import { sendSuccess } from "./helpers/response.helper";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "http://localhost:3000",
];

const envOrigins = (
  process.env.ALLOWED_ORIGINS ||
  process.env.FRONTEND_URL ||
  process.env.APP_URL ||
  ""
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// Static uploads directory with directory listing disabled
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    dotfiles: "ignore",
    index: false,
    maxAge: "7d",
  })
);

app.get("/api/health", (_req, res) => {
  sendSuccess(res, 200, "GoogleDoko API is running.", {
    timestamp: new Date().toISOString(),
    status: "healthy",
  });
});

app.use("/api", routes);

app.use(errorHandler);

export default app;
