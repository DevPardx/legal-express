import { Queue } from "bullmq";
import { bullmqConnection } from "@/config/redis.config.js";
import type { PdfGenerationJob } from "@/types/index.js";

// Queue name constant to avoid typos
export const PDF_QUEUE_NAME = "pdf-generation";

export const pdfQueue = new Queue<PdfGenerationJob>(PDF_QUEUE_NAME, {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000
        },
        removeOnComplete: {
            count: 100
        },
        removeOnFail: {
            count: 50
        }
    }
});