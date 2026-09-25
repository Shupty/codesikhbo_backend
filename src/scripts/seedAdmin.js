const { connectDatabase, disconnectDatabase } = require("../config/db");
const { env } = require("../config/env");
const { User, hashPassword } = require("../models/User");

async function seed() {
  await connectDatabase();
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== "admin") { existing.role = "admin"; await existing.save(); }
    console.log("Admin account already exists.");
  } else {
    await User.create({ name: env.ADMIN_NAME, email, passwordHash: await hashPassword(env.ADMIN_PASSWORD), role: "admin" });
    console.log("Admin account created.");
  }
  await disconnectDatabase();
}
seed().catch(async (error) => { console.error("Unable to seed admin:", error.message); await disconnectDatabase(); process.exit(1); });
