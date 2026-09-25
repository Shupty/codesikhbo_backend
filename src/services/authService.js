const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { User, hashPassword, comparePassword, publicUser } = require("../models/User");

function tokenFor(user) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user._id),
    expiresIn: env.JWT_EXPIRES_IN
  });
}

async function register(input) {
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password)
  });
  return { user: publicUser(user), token: tokenFor(user) };
}

async function login(input) {
  const user = await User.findOne({
    email: input.email.toLowerCase(),
    active: true
  }).select("+passwordHash");
  if (!user || !(await comparePassword(input.password, user.passwordHash))) {
    const error = new Error("Invalid email or password");
    error.status = 401;
    throw error;
  }
  return { user: publicUser(user), token: tokenFor(user) };
}

async function currentUser(userId) {
  const user = await User.findById(userId).select("name email role active createdAt");
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }
  return publicUser(user);
}

module.exports = { register, login, currentUser };
