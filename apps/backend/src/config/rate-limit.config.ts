import { rateLimit, type Options } from "express-rate-limit";

const baseConfig: Partial<Options> = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later.",
    },
  },
};

export const apiRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1_000,
  limit: 100,
});

export const generateDocRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Document generation limit reached. Please wait before submitting again.",
    },
  },
});

export const webhookRateLimiter = rateLimit({
  ...baseConfig,
  windowMs: 1 * 60 * 1_000,
  limit: 60,
});