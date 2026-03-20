// Set required environment variables for tests if not already provided
// (CI injects real values; this enables local test runs without a live stack)
const defaults: Record<string, string> = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://postgres:password@localhost:5432/legal_express_test",
  REDIS_URL: "redis://localhost:6379",
  JWT_SECRET: "test-jwt-secret-key-that-is-at-least-32-characters-long",
  ADMIN_EMAIL: "admin@test.com",
  ADMIN_PASSWORD: "password123",
  FRONTEND_URL: "http://localhost:5173",
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}
