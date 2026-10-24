import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

// Fail-safe validation for production deployments
if (isProduction) {
  const secret = process.env.JWT_SECRET;
  if (
    !secret ||
    secret.length < 32 ||
    secret.includes("replace_with_a_secure") ||
    secret.includes("dev_fallback")
  ) {
    throw new Error(
      "[CONFIGURATION ERROR] In production, JWT_SECRET must be set to a secure string of at least 32 characters.",
    );
  }
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientPort: parseInt(process.env.CLIENT_PORT || "5173", 10),
  db: {
    connectionString: process.env.DATABASE_URL || null,
    ssl:
      process.env.DB_SSL === "true" ||
      Boolean(
        process.env.DATABASE_URL &&
          process.env.DATABASE_URL.includes("sslmode=require"),
      ),
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    ca: process.env.DB_CA_CERT || undefined,
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseInt(process.env.DB_PORT || "5433", 10),
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    name: isTest
      ? process.env.DB_TEST_NAME || "b2b_order_db_test"
      : process.env.DB_NAME || "b2b_order_db",
    maxConnections: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "dev_fallback_secret_arrowstack_b2b_2026",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },
  // cors: {
  //   origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // },
  cors: {
    origins: (
      process.env.CORS_ORIGINS ||
      process.env.CORS_ORIGIN ||
      "http://localhost:5173"
    )
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "1000", 10),
  },
};
