import { Router } from "express";
import Attendance from "../models/Attendance.js";
import { protect, allowRoles } from "../middleware/auth.js";
const router = Router();
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
};

router.get("/", protect, async (req, res, next) => {
  try {
    const filter = req.user.role === "employee" ? { employee: req.user._id } : {};
    const rows = await Attendance.find(filter).populate("employee", "name email department").sort({ dateKey: -1 }).limit(100);
    res.json(rows);
  } catch (err) { next(err); }
});
router.post("/check-in", protect, async (req, res, next) => {
  try {
    const dateKey = todayKey();
    let row = await Attendance.findOne({ employee: req.user._id, dateKey });
    if (row?.checkIn) return res.status(409).json({ message: "You have already checked in today." });
    if (!row) row = new Attendance({ employee: req.user._id, dateKey });
    row.checkIn = new Date();
    await row.save();
    res.status(201).json(row);
  } catch (err) { next(err); }
});
router.patch("/check-out", protect, async (req, res, next) => {
  try {
    const row = await Attendance.findOne({ employee: req.user._id, dateKey: todayKey() });
    if (!row?.checkIn) return res.status(400).json({ message: "Check in before checking out." });
    if (row.checkOut) return res.status(409).json({ message: "You have already checked out today." });
    row.checkOut = new Date();
    await row.save();
    res.json(row);
  } catch (err) { next(err); }
});
export default router;
