const mongoose = require("mongoose");
const { env } = require("./env");

let connectionPromise;

async function connectDatabase() {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise && mongoose.connection.readyState === 2) return connectionPromise;
  connectionPromise = mongoose.connect(env.MONGO_URI).catch((error) => {
    connectionPromise = undefined;
    throw error;
  });
  return connectionPromise;
}

async function disconnectDatabase() {
  connectionPromise = undefined;
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
