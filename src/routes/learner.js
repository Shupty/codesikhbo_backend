const { Router } = require("express");
const { z } = require("zod");
const { Course } = require("../models/Course");
const { Enrollment } = require("../models/Enrollment");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const progressInput = z.object({ progress: z.number().min(0).max(100) }).strict();

function courseProjection(query) {
  return query.populate("instructor", "name email").sort({ createdAt: -1 });
}

router.use(requireAuth);

router.get("/courses", asyncHandler(async (req, res) => {
  const courses = await courseProjection(Course.find({ published: true }));
  res.json({ courses });
}));

router.get("/enrollments", asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.auth.userId })
    .populate({ path: "course", populate: { path: "instructor", select: "name email" } })
    .sort({ createdAt: -1 });
  res.json({ enrollments });
}));

router.post("/courses/:courseId/enroll", asyncHandler(async (req, res) => {
  const courseId = objectId.parse(req.params.courseId);
  const course = await Course.findOne({ _id: courseId, published: true });
  if (!course) return res.status(404).json({ error: "Published course not found" });

  const enrollment = await Enrollment.create({ user: req.auth.userId, course: courseId });
  await enrollment.populate({ path: "course", populate: { path: "instructor", select: "name email" } });
  res.status(201).json({ enrollment });
}));

router.delete("/courses/:courseId/enroll", asyncHandler(async (req, res) => {
  const courseId = objectId.parse(req.params.courseId);
  const enrollment = await Enrollment.findOneAndDelete({ user: req.auth.userId, course: courseId });
  if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
  res.status(204).send();
}));

router.patch("/enrollments/:courseId/progress", asyncHandler(async (req, res) => {
  const courseId = objectId.parse(req.params.courseId);
  const { progress } = progressInput.parse(req.body);
  const enrollment = await Enrollment.findOneAndUpdate(
    { user: req.auth.userId, course: courseId },
    { progress },
    { new: true, runValidators: true }
  ).populate({ path: "course", populate: { path: "instructor", select: "name email" } });
  if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });
  res.json({ enrollment });
}));

module.exports = router;
