import { Router } from "express";
import Announcement from "../models/Announcement.js";
import { protect, allowRoles } from "../middleware/auth.js";
const router = Router();

router.get("/", protect, async (_req, res, next) => {
  try {
    res.json(await Announcement.find().populate("author", "name role").sort({ createdAt: -1 }).limit(100));
  } catch (err) { next(err); }
});
router.post("/", protect, allowRoles("hr", "manager"), async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message are required." });
    const row = await Announcement.create({ title, message, author: req.user._id });
    res.status(201).json(await row.populate("author", "name role"));
  } catch (err) { next(err); }
});
export default router;
