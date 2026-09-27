const { Router } = require("express");
const { z } = require("zod");
const { Course } = require("../models/Course");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();
const courseInput = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(5000).default(""),
  published: z.boolean().default(false)
}).strict();

router.get("/", requireAuth, asyncHandler(async (req, res) => {
  const filter = req.auth.user.role === "admin" ? {} : { published: true };
  res.json({ courses: await Course.find(filter).populate("instructor", "name email").sort({ createdAt: -1 }) });
}));

router.post("/", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const input = courseInput.parse(req.body);
  const course = await Course.create({ ...input, instructor: req.auth.userId });
  res.status(201).json({ course: await course.populate("instructor", "name email") });
}));

router.patch("/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const input = courseInput.partial().parse(req.body);
  const course = await Course.findByIdAndUpdate(req.params.id, input, { new: true, runValidators: true }).populate("instructor", "name email");
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json({ course });
}));

router.delete("/:id", requireAuth, requireRole("admin"), asyncHandler(async (req, res) => {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.status(204).send();
}));

module.exports = router;
