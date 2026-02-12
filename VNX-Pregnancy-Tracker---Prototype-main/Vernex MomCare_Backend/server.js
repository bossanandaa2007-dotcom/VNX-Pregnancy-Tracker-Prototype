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

const app = express();

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
    return origins;
  }

  if (credentialsEnabled) {
    throw new Error(
      "CORS_ORIGINS must be set when CORS_CREDENTIALS=true. Use comma-separated allowed origins."
    );
  }

  return "*";
};

const corsCredentials = parseCorsCredentials();
const corsOrigins = parseCorsOrigins(corsCredentials);

// 1) Connect DB
connectDB();

// 2) Middleware
app.use(
  cors({
    origin: corsOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: corsCredentials,
  })
);
app.use(express.json({ limit: "5mb" }));

// 3) Routes
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

// 4) 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// 5) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
