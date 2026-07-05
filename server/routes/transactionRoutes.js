import { Router } from "express";
import { createTransaction, deleteTransaction, getCustomerLedger, getTransaction, listTransactions } from "../controllers/transactionController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDb } from "../middleware/requireDb.js";

const router = Router();

router.use(requireDb, requireAuth);
router.post("/", createTransaction);
router.get("/", listTransactions);
router.get("/customer/:customerId", getCustomerLedger);
router.get("/:id", getTransaction);
router.delete("/:id", deleteTransaction);

export default router;
