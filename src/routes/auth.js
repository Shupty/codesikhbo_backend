const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const controller = require("../controllers/authController");
const { rateLimit } = require("express-rate-limit");

const router = Router();
const authAttemptLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false
});
router.post("/register", authAttemptLimit, asyncHandler(controller.register));
router.post("/login", authAttemptLimit, asyncHandler(controller.login));
router.get("/me", requireAuth, asyncHandler(controller.me));

module.exports = router;
