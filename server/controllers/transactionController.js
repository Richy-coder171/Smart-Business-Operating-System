import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { isValidObjectId } from "../config/db.js";
import { createLedgerTransaction, deleteLedgerTransaction, withRunningBalance } from "../services/ledgerService.js";
import { transactionCreateSchema, transactionQuerySchema } from "../validators/transactionValidators.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

function ensureObjectId(id, label = "id") {
  if (!isValidObjectId(id)) {
    throw new ApiError(400, `Invalid ${label}.`);
  }
}

export const createTransaction = asyncHandler(async (req, res) => {
  const payload = transactionCreateSchema.parse(req.body);
  ensureObjectId(payload.customerId, "customer id");

  const result = await createLedgerTransaction(req.ownerId, payload);

  res.status(201).json({
    success: true,
    transaction: result.transaction,
    customer: result.customer
  });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const query = transactionQuerySchema.parse(req.query);
  const filter = { ownerId: req.ownerId };

  if (query.customerId) {
    ensureObjectId(query.customerId, "customer id");
    filter.customerId = query.customerId;
  }

  if (query.type) {
    filter.type = query.type;
  }

  const skip = (query.page - 1) * query.limit;
  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate("customerId", "name phone")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(query.limit),
    Transaction.countDocuments(filter)
  ]);

  res.json({
    success: true,
    transactions,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      pages: Math.ceil(total / query.limit)
    }
  });
});

export const getCustomerLedger = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.customerId, "customer id");
  const customer = await Customer.findOne({ _id: req.params.customerId, ownerId: req.ownerId });

  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  const transactions = await Transaction.find({
    ownerId: req.ownerId,
    customerId: customer._id
  }).sort({ date: 1, createdAt: 1, _id: 1 });

  res.json({
    success: true,
    customer,
    transactions: withRunningBalance(transactions)
  });
});

export const getTransaction = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const transaction = await Transaction.findOne({ _id: req.params.id, ownerId: req.ownerId });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  res.json({ success: true, transaction });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  ensureObjectId(req.params.id);
  const result = await deleteLedgerTransaction(req.ownerId, req.params.id);

  res.json({
    success: true,
    message: "Transaction deleted and balance recalculated.",
    transaction: result.transaction,
    customer: result.customer
  });
});
