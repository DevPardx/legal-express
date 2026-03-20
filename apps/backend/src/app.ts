import express from "express";
import helmet from "helmet";
import cors from "cors";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import documentRoutes from "./routes/document.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import authRoutes from "./routes/auth.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import { helmetConfig } from "./config/helmet.config.js";
import { apiRateLimiter } from "./config/rate-limit.config.js";
import { corsConfig } from "./config/cors.config.js";
import { env } from "./config/env.config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp() {
    const app = express();

    app.use(helmet(helmetConfig));
    app.use(cors(corsConfig));
    app.use(apiRateLimiter);

    app.use(express.json({ limit: "1mb" }));
    app.use(express.urlencoded({ extended: true }));

    const generatedDir = join(__dirname, "../", env.PDF_STORAGE_DIR);
    app.use("/generated", express.static(generatedDir));

      app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.use('/api', authRoutes);
    app.use('/api', documentRoutes);
    app.use('/api', webhookRoutes);
    app.use('/api', invoiceRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}