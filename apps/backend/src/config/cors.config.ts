import type { CorsOptions } from "cors";
import { env } from "./env.config.js";

const allowedOrigins: string[] =
  env.NODE_ENV === "production"
    ? [env.FRONTEND_URL]
    : [env.FRONTEND_URL, "http://localhost:5173", "http://localhost:4173"];

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
  credentials: true,
  maxAge: 86_400,
};