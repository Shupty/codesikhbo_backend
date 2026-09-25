const { Router } = require("express");
const { z } = require("zod");
const { User, hashPassword, publicUser } = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = Router();
router.use(requireAuth, requireRole("admin"));
router.get("/", async (req, res) => {
  const users = await User.find().select("name email role active createdAt").sort({ createdAt: -1 });
  res.json({ users: users.map(publicUser) });
});
router.patch("/:id", async (req, res) => {
  const input = z.object({ role: z.enum(["admin", "user"]).optional(), active: z.boolean().optional(), name: z.string().trim().min(2).max(120).optional() }).strict().parse(req.body);
  if (req.params.id === req.auth.userId && input.active === false) return res.status(400).json({ error: "You cannot deactivate your own account" });
  const user = await User.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true }).select("name email role active createdAt");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});
router.post("/:id/reset-password", async (req, res) => {
  const { password } = z.object({ password: z.string().min(8).max(128) }).parse(req.body);
  const user = await User.findByIdAndUpdate(req.params.id, { passwordHash: await hashPassword(password) }, { new: true });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ message: "Password reset successfully" });
});
module.exports = router;
