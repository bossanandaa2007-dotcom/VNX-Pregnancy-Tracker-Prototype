const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  const databaseName = process.env.MONGO_DB_NAME || "vernex_momcare";

  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined");
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: databaseName,
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT_MS || 5000),
    });

    await conn.connection.db.admin().ping();
    console.log(`MongoDB connected to ${databaseName}`);

    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
