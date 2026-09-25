const { Router } = require("express");
const { requireAuth } = require("../middleware/auth");
const { User } = require("../models/User");
const { Course } = require("../models/Course");

const router = Router();
router.get("/", requireAuth, async (req, res) => {
  const [users, courses, publishedCourses] = await Promise.all([
    User.countDocuments(), Course.countDocuments(), Course.countDocuments({ published: true })
  ]);
  res.json({ user: req.auth.user, stats: { users, courses, publishedCourses } });
});
module.exports = router;
