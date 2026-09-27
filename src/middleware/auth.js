const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { User } = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    if (!header.startsWith("Bearer ")) return res.status(401).json({ error: "Authentication required" });
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("name email role active +tokenVersion");
    if (!user || !user.active) return res.status(401).json({ error: "Authentication required" });
    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.auth = { userId: String(user._id), user };
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    next(error);
  }
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.auth || !allowed.includes(req.auth.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

module.exports = { requireAuth, requireRole };
