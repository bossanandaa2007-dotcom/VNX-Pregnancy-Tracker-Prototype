const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const diaryRoutes = require("./routes/diaryRoutes");
const pregnancyRoutes = require("./routes/pregnancyRoutes");
const messageRoutes = require("./routes/messageRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const syncRoutes = require("./routes/syncRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const trackerRoutes = require("./routes/trackerRoutes");

const app = express();
const DEV_CORS_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const parseCorsCredentials = () => {
  const raw = (process.env.CORS_CREDENTIALS || "true").toLowerCase();
  return raw === "true";
};

const parseCorsOrigins = (credentialsEnabled) => {
  const origins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (origins.length > 0) {
    return [...new Set([...origins, ...DEV_CORS_ORIGINS])];
  }

  if (credentialsEnabled) {
    return DEV_CORS_ORIGINS;
  }

  return "*";
};

const corsCredentials = parseCorsCredentials();
const corsOrigins = parseCorsOrigins(corsCredentials);

// 1) Middleware
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: corsCredentials,
  })
);
app.use(express.json({ limit: "5mb" }));

// 2) Routes
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/pregnancy", pregnancyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/trackers", trackerRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/devices", deviceRoutes);

// 3) 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 4) Start server after DB check
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup aborted:", error.message);
    process.exit(1);
  }
};

startServer();
