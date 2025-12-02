import express from "express";
import { getAnalytics } from "./analytics.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = express.Router();

// Restrict to admin/teacher
router.get("/overview", authenticate, (req, res, next) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }
  return getAnalytics(req, res, next);
});

export default router;
