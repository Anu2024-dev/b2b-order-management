import express from "express";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config/env.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.routes.js";
import { NotFoundError } from "./utils/errors.js";

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. server-to-server, health checks, automated tests)
      if (!origin) {
        return callback(null, true);
      }

      // In production: strictly permit only the configured trusted frontend origin
      if (config.env === "production") {
        if (origin === config.cors.origins.includes(origin)) {
          return callback(null, true);
        }
        return callback(
          new Error(
            "Blocked by CORS policy: Origin not permitted in production",
          ),
        );
      }

      // In development / test: allow matching origin or any localhost port
      if (
        origin === config.cors.origin ||
        origin.startsWith("http://localhost:")
      ) {
        return callback(null, true);
      }

      return callback(new Error("Blocked by CORS policy"));
    },
    credentials: true,
  }),
);

// Body parsing with safe size limit
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Apply global rate limiter
app.use("/api", globalLimiter);

// Disable client-side back/forward and intermediate proxy caching for API routes
app.use("/api", (req, res, next) => {
  res.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// API v1 prefix
app.use("/api/v1", apiRoutes);

// Catch-all 404 for unhandled API routes
app.use("/api", (req, res, next) => {
  next(
    new NotFoundError(
      `API endpoint '${req.method} ${req.originalUrl}' not found`,
    ),
  );
});

// Centralized error handling
app.use(errorHandler);

export default app;
