function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.name === "ZodError") return res.status(400).json({ error: "Validation failed", details: error.issues });
  if (error.code === 11000) return res.status(409).json({ error: "A record with that value already exists" });
  if (error.name === "CastError") return res.status(400).json({ error: "Invalid identifier" });
  if (error.status && error.status >= 400 && error.status < 500) return res.status(error.status).json({ error: error.message });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = { notFound, errorHandler };
