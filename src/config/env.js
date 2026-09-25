const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const values = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4100),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(6),
  JWT_EXPIRES_IN: z.string().default("1d"),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  ADMIN_EMAIL: z.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeMe123!"),
  ADMIN_NAME: z.string().trim().min(2).max(120).default("LMS Administrator")
}).parse(process.env);

module.exports = { env: values };
