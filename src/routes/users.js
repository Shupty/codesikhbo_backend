const { Router } = require("express");
const { z } = require("zod");
const { User, hashPassword, publicUser } = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/", asyncHandler(async (req, res) => {
  const users = await User.find().select("name email role active createdAt").sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
}));
router.patch("/:id", asyncHandler(async (req, res) => {
  const input = z.object({ role: z.enum(["admin", "user"]).optional(), active: z.boolean().optional(), name: z.string().trim().min(2).max(120).optional() }).strict().parse(req.body);
  const existingUser = await User.findById(req.params.id).select("role active");
  if (!existingUser) return res.status(404).json({ error: "User not found" });
  if (req.params.id === req.auth.userId && (input.active === false || input.role === "user")) {
    return res.status(400).json({ error: "You cannot deactivate or demote your own account" });
  }
  const removingActiveAdmin = existingUser.role === "admin" && existingUser.active &&
    (input.active === false || input.role === "user");
  if (removingActiveAdmin && await User.countDocuments({ role: "admin", active: true }) <= 1) {
    return res.status(409).json({ error: "At least one active administrator must remain" });
  }
  const update = { $set: input };
  if ((input.active === false && existingUser.active) || (input.role && input.role !== existingUser.role)) {
    update.$inc = { tokenVersion: 1 };
  }
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select("name email role active createdAt");
  res.json({ user: publicUser(user) });
}));
router.post("/:id/reset-password", asyncHandler(async (req, res) => {
  const { password } = z.object({ password: z.string().min(8).max(128) }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, {
    $set: { passwordHash: await hashPassword(password) },
    $inc: { tokenVersion: 1 }
  }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ message: "Password reset successfully" });
}));
module.exports = router;
