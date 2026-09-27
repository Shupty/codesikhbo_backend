const bcrypt = require("bcryptjs");
const { model, Schema } = require("mongoose");

const roles = ["admin", "user"];
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: roles, default: "user", index: true },
  active: { type: Boolean, default: true, index: true },
  tokenVersion: { type: Number, default: 0, select: false }
}, { timestamps: true, versionKey: false });

const User = model("User", userSchema);
const hashPassword = (password) => bcrypt.hash(password, 12);
const comparePassword = (password, hash) => bcrypt.compare(password, hash);
const publicUser = (user) => ({
  id: String(user._id || user.id), name: user.name, email: user.email,
  role: user.role, active: user.active, createdAt: user.createdAt
});

module.exports = { User, roles, hashPassword, comparePassword, publicUser };
