import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = Router();
const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  department: user.department, jobTitle: user.jobTitle
});
const makeToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || "dev_only_change_me", { expiresIn: "7d" });

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, department, jobTitle } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email, and password are required." });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({
      name, email, passwordHash: await bcrypt.hash(password, 12),
      department: department || "General", jobTitle: jobTitle || "Employee", role: "employee"
    });
    res.status(201).json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }
    res.json({ token: makeToken(user), user: publicUser(user) });
  } catch (err) { next(err); }
});

router.get("/me", protect, (req, res) => res.json({ user: publicUser(req.user) }));
export default router;
