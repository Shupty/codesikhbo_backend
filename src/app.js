const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");
const { env } = require("./config/env");
const { connectDatabase } = require("./config/db");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const learnerRoutes = require("./routes/learner");
const { notFound, errorHandler } = require("./middleware/errors");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
    return callback(Object.assign(new Error("Origin not allowed by CORS"), { status: 403 }));
  }
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
if (process.env.VERCEL === "1") {
  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    connectDatabase().then(() => next(), next);
  });
}
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/ready", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready" });
});
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/learner", learnerRoutes);
app.use(notFound);
app.use(errorHandler);
module.exports = app;
