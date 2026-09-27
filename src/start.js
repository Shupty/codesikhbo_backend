const app = require("./app");
const { env } = require("./config/env");
const { connectDatabase, disconnectDatabase } = require("./config/db");

async function start() {
  await connectDatabase();
  const server = app.listen(env.PORT, "0.0.0.0", () => console.log(`LMS API listening on port ${env.PORT}`));
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal}: shutting down`);
    const forceExit = setTimeout(() => {
      console.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10000);
    forceExit.unref();
    server.close(async (error) => {
      try {
        await disconnectDatabase();
        clearTimeout(forceExit);
        if (error) {
          console.error("HTTP server shutdown failed", error);
          process.exit(1);
        }
        process.exit(0);
      } catch (shutdownError) {
        console.error("Database shutdown failed", shutdownError);
        process.exit(1);
      }
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}
start().catch((error) => { console.error("Failed to start server", error.message); process.exit(1); });
