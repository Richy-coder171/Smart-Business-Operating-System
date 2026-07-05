import Customer from "../../models/Customer.js";
import Transaction from "../../models/Transaction.js";
import { ensureAiAvailableOrDemo } from "./geminiClient.js";
import { businessInsightsSchema } from "./schemas.js";
import { indiaStartOfDay } from "../../utils/dates.js";

export async function calculateBusinessInsights(ownerId) {
  const customers = await Customer.find({ ownerId, status: "active" }).sort({ totalDue: -1 });

  if (customers.length === 0) {
    return [];
  }

  ensureAiAvailableOrDemo();

  const todayStart = indiaStartOfDay(new Date());
  const totalOutstanding = customers.reduce((sum, customer) => sum + customer.totalDue, 0);
  const overdue = customers.filter(
    (customer) => customer.totalDue > 0 && customer.nextFollowUpDate && customer.nextFollowUpDate < todayStart
  );
  const topDebtor = customers.find((customer) => customer.totalDue > 0);
  const payments = await Transaction.aggregate([
    { $match: { ownerId, type: "payment" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const insights = [];

  if (topDebtor) {
    insights.push({
      title: "Largest outstanding balance",
      description: `${topDebtor.name} has the highest pending balance. This is a good first follow-up target.`,
      priority: topDebtor.totalDue > 10000 ? "high" : "medium",
      suggestedAction: "Send a polite reminder and agree on a payment date.",
      relatedCustomerId: String(topDebtor._id),
      supportingMetric: {
        name: "topDebtorDue",
        value: topDebtor.totalDue
      }
    });
  }

  if (overdue.length > 0) {
    insights.push({
      title: "Follow-ups are overdue",
      description: `${overdue.length} customer follow-up date has passed while money is still pending.`,
      priority: overdue.length >= 3 ? "high" : "medium",
      suggestedAction: "Review overdue customers and contact them today.",
      relatedCustomerId: String(overdue[0]._id),
      supportingMetric: {
        name: "overdueCustomers",
        value: overdue.length
      }
    });
  }

  insights.push({
    title: "Outstanding ledger position",
    description: `Your active customer ledger has pending dues that should be tracked daily.`,
    priority: totalOutstanding > 25000 ? "high" : "low",
    suggestedAction: "Focus on high-value dues before adding more credit.",
    relatedCustomerId: topDebtor ? String(topDebtor._id) : null,
    supportingMetric: {
      name: "totalOutstanding",
      value: totalOutstanding
    }
  });

  insights.push({
    title: "Collection baseline",
    description: "Recorded payments provide the baseline for collection trend analysis.",
    priority: "low",
    suggestedAction: "Keep recording payments as soon as they are verified.",
    relatedCustomerId: null,
    supportingMetric: {
      name: "totalCollected",
      value: payments[0]?.total || 0
    }
  });

  return businessInsightsSchema.parse(insights.slice(0, 6));
}
