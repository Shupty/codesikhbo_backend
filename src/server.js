const { app } = require("./app");
const { env } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/db");

async function start() {
  await connectDatabase();
  const server = app.listen(env.PORT, () => console.log(`LMS API listening on port ${env.PORT}`));
  const shutdown = async (signal) => {
    console.log(`${signal}: shutting down`);
    server.close(async () => { await disconnectDatabase(); process.exit(0); });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
start().catch((error) => { console.error("Failed to start server", error.message); process.exit(1); });
