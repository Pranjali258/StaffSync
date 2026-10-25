import { Router } from "express";
import User from "../models/User.js";
import { protect, allowRoles } from "../middleware/auth.js";
const router = Router();

router.get("/", protect, async (req, res, next) => {
  try {
    const query = req.user.role === "employee" ? { _id: req.user._id } : {};
    const users = await User.find(query).select("name email role department jobTitle createdAt").sort({ name: 1 });
    res.json(users);
  } catch (err) { next(err); }
});

router.patch("/:id", protect, allowRoles("hr"), async (req, res, next) => {
  try {
    const allowed = ["name", "department", "jobTitle", "role"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (updates.role && !["hr", "manager", "employee"].includes(updates.role)) return res.status(400).json({ message: "Invalid role." });
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "Employee not found." });
    res.json(user);
  } catch (err) { next(err); }
});
export default router;
