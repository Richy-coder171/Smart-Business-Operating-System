import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { ApiError } from "../utils/ApiError.js";
import { roundMoney } from "../utils/money.js";

function isTransactionUnsupported(error) {
  return /Transaction numbers are only allowed|replica set|mongos|Transaction.*not supported/i.test(
    error.message || ""
  );
}

async function withOptionalTransaction(operation) {
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) {
      return operation(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

function bindSession(query, session) {
  return session ? query.session(session) : query;
}

export async function createLedgerTransaction(ownerId, payload) {
  return withOptionalTransaction(async (session) => {
    const customer = await bindSession(
      Customer.findOne({ _id: payload.customerId, ownerId }),
      session
    );

    if (!customer) {
      throw new ApiError(404, "Customer not found.");
    }

    const amount = roundMoney(payload.amount);

    if (payload.type === "payment" && amount > customer.totalDue) {
      throw new ApiError(400, "Payment cannot exceed the current due balance.");
    }

    const [transaction] = await Transaction.create(
      [
        {
          ownerId,
          customerId: customer._id,
          type: payload.type,
          amount,
          description: payload.description,
          date: payload.date || new Date(),
          paymentMethod: payload.paymentMethod,
          referenceNumber: payload.referenceNumber
        }
      ],
      session ? { session } : {}
    );

    if (payload.type === "credit") {
      customer.totalDue = roundMoney(customer.totalDue + amount);
    } else {
      customer.totalDue = roundMoney(customer.totalDue - amount);
      customer.totalPaid = roundMoney(customer.totalPaid + amount);
      customer.lastPaymentDate = payload.date || new Date();
    }

    await customer.save(session ? { session } : {});

    return { transaction, customer };
  });
}

export async function recalculateCustomerBalance(ownerId, customerId, session = null) {
  const transactions = await bindSession(
    Transaction.find({ ownerId, customerId }).sort({ date: 1, createdAt: 1, _id: 1 }),
    session
  );

  let totalDue = 0;
  let totalPaid = 0;
  let lastPaymentDate = null;

  for (const transaction of transactions) {
    if (transaction.type === "credit") {
      totalDue = roundMoney(totalDue + transaction.amount);
    } else {
      totalDue = roundMoney(Math.max(0, totalDue - transaction.amount));
      totalPaid = roundMoney(totalPaid + transaction.amount);
      lastPaymentDate = transaction.date;
    }
  }

  const customer = await bindSession(Customer.findOne({ _id: customerId, ownerId }), session);
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  customer.totalDue = totalDue;
  customer.totalPaid = totalPaid;
  customer.lastPaymentDate = lastPaymentDate;
  await customer.save(session ? { session } : {});
  return customer;
}

export async function deleteLedgerTransaction(ownerId, transactionId) {
  const transaction = await Transaction.findOne({ _id: transactionId, ownerId });

  if (!transaction) {
    throw new ApiError(404, "Transaction not found.");
  }

  return withOptionalTransaction(async (session) => {
    await bindSession(Transaction.deleteOne({ _id: transaction._id, ownerId }), session);
    const customer = await recalculateCustomerBalance(ownerId, transaction.customerId, session);
    return { transaction, customer };
  });
}

export function withRunningBalance(transactions) {
  let runningBalance = 0;
  return transactions.map((transaction) => {
    runningBalance =
      transaction.type === "credit"
        ? roundMoney(runningBalance + transaction.amount)
        : roundMoney(runningBalance - transaction.amount);

    const doc = typeof transaction.toObject === "function" ? transaction.toObject() : transaction;
    return {
      ...doc,
      runningBalance
    };
  });
}
