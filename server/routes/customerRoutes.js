import { Router } from "express";
import { createCustomer, deleteCustomer, getCustomer, listCustomers, updateCustomer } from "../controllers/customerController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireDb } from "../middleware/requireDb.js";

const router = Router();

router.use(requireDb, requireAuth);
router.get("/", listCustomers);
router.post("/", createCustomer);
router.get("/:id", getCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

export default router;
