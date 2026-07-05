import { Router } from "express";
import { getDashboard } from "../controllers/dashboardController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDb } from "../middleware/requireDb.js";

const router = Router();

router.get("/", requireDb, requireAuth, getDashboard);

export default router;
