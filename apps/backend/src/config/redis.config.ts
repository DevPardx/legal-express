import { Redis } from "ioredis";
import { env } from "./env.config.js";

const redisUrl = new URL(env.REDIS_URL);

// Plain options for BullMQ
export const bullmqConnection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port) || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
};

// Shared Redis instance for non-BullMQ usage
export const redisConnection = new Redis(env.REDIS_URL, {
    lazyConnect: true,
});

redisConnection.on("error", err => {
    console.log("Redis connection error:", err);
});

redisConnection.on("connect", () => {
    console.log("Redis connected");
});