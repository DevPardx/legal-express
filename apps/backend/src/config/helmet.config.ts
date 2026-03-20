import type { HelmetOptions } from "helmet";

export const helmetConfig: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  // Prevents browsers from sniffing MIME types
  noSniff: true,
  // Forces HTTPS for 1 year (enable only in production with real TLS)
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
    preload: true,
  },
  // Prevents clickjacking
  frameguard: { action: "deny" },
  // Removes X-Powered-By: Express header
  hidePoweredBy: true,
};