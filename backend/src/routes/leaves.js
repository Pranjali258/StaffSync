import { Router } from "express";
import Leave from "../models/Leave.js";
import { protect, allowRoles } from "../middleware/auth.js";
const router = Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const filter = req.user.role === "employee" ? { employee: req.user._id } : {};
    const rows = await Leave.find(filter).populate("employee", "name email department").populate("reviewedBy", "name").sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", protect, async (req, res, next) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) return res.status(400).json({ message: "Start date, end date, and reason are required." });
    if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ message: "End date must be on or after start date." });
    const row = await Leave.create({ employee: req.user._id, startDate, endDate, reason });
    res.status(201).json(await row.populate("employee", "name email department"));
  } catch (err) { next(err); }
});

router.patch("/:id/status", protect, allowRoles("hr", "manager"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Status must be approved or rejected." });
    const row = await Leave.findByIdAndUpdate(req.params.id, { status, reviewedBy: req.user._id }, { new: true })
      .populate("employee", "name email department").populate("reviewedBy", "name");
    if (!row) return res.status(404).json({ message: "Leave request not found." });
    res.json(row);
  } catch (err) { next(err); }
});
export default router;
