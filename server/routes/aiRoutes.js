import { Router } from "express";
import { analyzeReply, assistant, businessInsights, generateReminder, markReminderSent } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import { requireDb } from "../middleware/requireDb.js";

const router = Router();

router.use(requireDb, requireAuth, aiLimiter);
router.post("/generate-reminder", generateReminder);
router.put("/reminders/:id/sent", markReminderSent);
router.post("/analyze-reply", analyzeReply);
router.post("/business-insights", businessInsights);
router.post("/assistant", assistant);

export default router;
