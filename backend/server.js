import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./src/routes/auth.js";
import employeeRoutes from "./src/routes/employees.js";
import leaveRoutes from "./src/routes/leaves.js";
import attendanceRoutes from "./src/routes/attendance.js";
import announcementRoutes from "./src/routes/announcements.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "StaffSync API" }));
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/announcements", announcementRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/staffsync")
  .then(() => app.listen(port, () => console.log(`StaffSync API running on http://localhost:${port}`)))
  .catch((err) => { console.error("MongoDB connection failed:", err.message); process.exit(1); });
