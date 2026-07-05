import Customer from "../../models/Customer.js";
import CustomerReply from "../../models/CustomerReply.js";
import Transaction from "../../models/Transaction.js";
import { ApiError } from "../../utils/ApiError.js";
import { indiaEndOfDay, indiaStartOfDay, monthStart, weekEndFrom } from "../../utils/dates.js";
import { formatINR } from "../../utils/money.js";

function makeCustomerLink(customer) {
  return {
    id: String(customer._id),
    name: customer.name,
    path: `/customers/${customer._id}`
  };
}

function parseAmount(question) {
  const match = question.match(/(?:more than|above|over|greater than)?\s*(?:rs\.?|inr)?\s*([0-9][0-9,]*)/i);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

export async function answerBusinessQuestion(ownerId, question) {
  const normalized = question.toLowerCase();
  const now = new Date();
  const todayStart = indiaStartOfDay(now);
  const todayEnd = indiaEndOfDay(now);

  if (/owes me the most|highest.*due|top debtor/.test(normalized)) {
    const customer = await Customer.findOne({ ownerId, status: "active", totalDue: { $gt: 0 } }).sort({ totalDue: -1 });
    return {
      answer: customer
        ? `${customer.name} owes the most with ${formatINR(customer.totalDue)} pending.`
        : "No active customer currently has pending dues.",
      supportingData: customer ? { totalDue: customer.totalDue } : {},
      customerLinks: customer ? [makeCustomerLink(customer)] : [],
      suggestedAction: customer ? "Send a reminder or review their ledger." : "No follow-up needed for this query."
    };
  }

  if (/collect.*today|today.*collect/.test(normalized)) {
    const result = await Transaction.aggregate([
      { $match: { ownerId, type: "payment", date: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const total = result[0]?.total || 0;
    return {
      answer: `You collected ${formatINR(total)} today.`,
      supportingData: { total, count: result[0]?.count || 0 },
      customerLinks: [],
      suggestedAction: "Record any verified cash or UPI payments that are still missing."
    };
  }

  if (/collect.*month|this month/.test(normalized)) {
    const result = await Transaction.aggregate([
      { $match: { ownerId, type: "payment", date: { $gte: monthStart(now), $lte: todayEnd } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const total = result[0]?.total || 0;
    return {
      answer: `You collected ${formatINR(total)} this month.`,
      supportingData: { total, count: result[0]?.count || 0 },
      customerLinks: [],
      suggestedAction: "Compare this with outstanding dues to plan follow-ups."
    };
  }

  if (/owe.*more than|customers.*above|customers.*over/.test(normalized)) {
    const amount = parseAmount(question) ?? 10000;
    const customers = await Customer.find({
      ownerId,
      status: "active",
      totalDue: { $gt: amount }
    }).sort({ totalDue: -1 });

    return {
      answer: `${customers.length} customer${customers.length === 1 ? "" : "s"} owe more than ${formatINR(amount)}.`,
      supportingData: customers.map((customer) => ({
        id: String(customer._id),
        name: customer.name,
        totalDue: customer.totalDue
      })),
      customerLinks: customers.map(makeCustomerLink),
      suggestedAction: "Start with the highest pending balance."
    };
  }

  if (/promised.*this week|promise.*week/.test(normalized)) {
    const replies = await CustomerReply.find({
      ownerId,
      intent: "promise_to_pay",
      promisedPaymentDate: { $gte: todayStart, $lte: weekEndFrom(now) }
    })
      .populate("customerId", "name totalDue")
      .sort({ promisedPaymentDate: 1 });

    return {
      answer: `${replies.length} customer promise${replies.length === 1 ? "" : "s"} are due this week.`,
      supportingData: replies.map((reply) => ({
        customer: reply.customerId?.name,
        promisedPaymentDate: reply.promisedPaymentDate
      })),
      customerLinks: replies.filter((reply) => reply.customerId).map((reply) => makeCustomerLink(reply.customerId)),
      suggestedAction: "Follow up on each promised date."
    };
  }

  if (/follow.*today|need follow/.test(normalized)) {
    const customers = await Customer.find({
      ownerId,
      status: "active",
      totalDue: { $gt: 0 },
      nextFollowUpDate: { $lte: todayEnd }
    }).sort({ nextFollowUpDate: 1 });

    return {
      answer: `${customers.length} customer${customers.length === 1 ? "" : "s"} need follow-up today.`,
      supportingData: customers.map((customer) => ({
        id: String(customer._id),
        name: customer.name,
        totalDue: customer.totalDue,
        nextFollowUpDate: customer.nextFollowUpDate
      })),
      customerLinks: customers.map(makeCustomerLink),
      suggestedAction: "Send reminders to customers with the oldest follow-up dates first."
    };
  }

  if (/recent payments|show.*payments/.test(normalized)) {
    const transactions = await Transaction.find({ ownerId, type: "payment" })
      .populate("customerId", "name")
      .sort({ date: -1, createdAt: -1 })
      .limit(8);

    return {
      answer: `Found ${transactions.length} recent payment${transactions.length === 1 ? "" : "s"}.`,
      supportingData: transactions.map((transaction) => ({
        customer: transaction.customerId?.name,
        amount: transaction.amount,
        date: transaction.date
      })),
      customerLinks: transactions.filter((transaction) => transaction.customerId).map((transaction) => makeCustomerLink(transaction.customerId)),
      suggestedAction: "Check that each payment has a matching receipt or note."
    };
  }

  if (/focus.*today|what should i focus/.test(normalized)) {
    const [topCustomer, followUps] = await Promise.all([
      Customer.findOne({ ownerId, status: "active", totalDue: { $gt: 0 } }).sort({ totalDue: -1 }),
      Customer.countDocuments({
        ownerId,
        status: "active",
        totalDue: { $gt: 0 },
        nextFollowUpDate: { $lte: todayEnd }
      })
    ]);

    return {
      answer: topCustomer
        ? `Focus on ${topCustomer.name} first and clear ${followUps} due follow-up${followUps === 1 ? "" : "s"}.`
        : "Focus on keeping ledgers updated; there are no pending dues right now.",
      supportingData: {
        topDue: topCustomer?.totalDue || 0,
        followUps
      },
      customerLinks: topCustomer ? [makeCustomerLink(topCustomer)] : [],
      suggestedAction: topCustomer ? "Generate a reminder and record any verified payments." : "Review recent transactions."
    };
  }

  throw new ApiError(
    400,
    "Unsupported question. Ask about dues, collections, promises, follow-ups, recent payments, or today's focus."
  );
}
