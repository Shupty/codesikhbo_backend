const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const values = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  TRUST_PROXY: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  ADMIN_NAME: z.string().trim().min(2).max(120).default("LMS Administrator")
}).superRefine((values, context) => {
  if (values.NODE_ENV !== "production") return;
  if (values.JWT_SECRET.length < 32 || values.JWT_SECRET === "replace-with-a-long-random-secret") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["JWT_SECRET"], message: "Must be a unique secret of at least 32 characters in production" });
  }
  if (values.ADMIN_PASSWORD.length < 16 || values.ADMIN_PASSWORD === "ChangeMe123!") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["ADMIN_PASSWORD"], message: "Must be a unique password of at least 16 characters in production" });
  }
  const origins = values.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean);
  if (!origins.length || origins.some((origin) => origin === "*")) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["CLIENT_ORIGIN"], message: "Must be a specific frontend origin in production" });
  }
  origins.forEach((origin) => {
    try {
      const parsed = new URL(origin);
      if (parsed.protocol !== "https:" || parsed.origin !== origin) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["CLIENT_ORIGIN"], message: "Production origins must be HTTPS origins without paths" });
      }
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["CLIENT_ORIGIN"], message: "Every production origin must be a valid HTTPS origin" });
    }
  });
}).transform((values) => ({
  ...values,
  CLIENT_ORIGINS: values.CLIENT_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
})).parse(process.env);

module.exports = { env: values };
