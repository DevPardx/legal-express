import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.config.js";
import { createPdfWorker } from "./queues/pdf.worker.js";
import { pdfQueue } from "./queues/pdf.queue.js";
import { env } from "./config/env.config.js";

async function bootstrap() {
    await connectDatabase();

    const worker = createPdfWorker();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
        console.log(`Server running on http://localhost:${env.PORT}`);
        console.log(`Environment: ${env.NODE_ENV}`);
    });

    const shutdown = async (signal: string) => {
        console.log(`${signal} received. Shutting down gracefully...`);

        server.close(async () => {
            await worker.close();
            await pdfQueue.close();
            await disconnectDatabase();
            console.log("Server closed");
            process.exit(0);
        });

        setTimeout(() => {
            console.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10_000);
    }

    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch(err => {
    console.error("Failed to start server: ", err);
    process.exit(1);
});