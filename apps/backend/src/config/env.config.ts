import z from "zod";

const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    FRONTEND_URL: z.url().default("http://localhost:5173"),
    PDF_STORAGE_DIR: z.string().default("./generated"),
    WEBHOOK_SECRET: z.string().min(32).optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    JWT_SECRET: z.string().min(32),
    ADMIN_EMAIL: z.string().email(),
    ADMIN_PASSWORD: z.string().min(6),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        console.error("Invalid environment variables");
        console.log(result.error.flatten().fieldErrors);
        process.exit(1);
    }

    return result.data;
}

export const env = validateEnv();