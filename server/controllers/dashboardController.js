import Customer from "../models/Customer.js";
import CustomerReply from "../models/CustomerReply.js";
import Transaction from "../models/Transaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { indiaEndOfDay, indiaStartOfDay, monthStart, weekEndFrom } from "../utils/dates.js";

function monthLabelExpression(field = "$date") {
  return {
    $dateToString: {
      format: "%Y-%m",
      date: field,
      timezone: "Asia/Kolkata"
    }
  };
}

export const getDashboard = asyncHandler(async (req, res) => {
  const ownerId = req.ownerId;
  const now = new Date();
  const todayStart = indiaStartOfDay(now);
  const todayEnd = indiaEndOfDay(now);
  const currentMonthStart = monthStart(now);
  const upcomingEnd = weekEndFrom(now);

  const [
    totalCustomers,
    outstandingAgg,
    todayCollectionsAgg,
    overdueCustomers,
    pendingFollowUps,
    recentTransactions,
    monthlyCollections,
    monthlyCredit,
    customerDistribution,
    topDebtors,
    upcomingPromises
  ] = await Promise.all([
    Customer.countDocuments({ ownerId, status: "active" }),
    Customer.aggregate([
      { $match: { ownerId, status: "active" } },
      { $group: { _id: null, totalOutstanding: { $sum: "$totalDue" } } }
    ]),
    Transaction.aggregate([
      {
        $match: {
          ownerId,
          type: "payment",
          date: { $gte: todayStart, $lte: todayEnd }
        }
      },
      { $group: { _id: null, todayCollections: { $sum: "$amount" } } }
    ]),
    Customer.countDocuments({
      ownerId,
      status: "active",
      totalDue: { $gt: 0 },
      nextFollowUpDate: { $lt: todayStart }
    }),
    Customer.countDocuments({
      ownerId,
      status: "active",
      totalDue: { $gt: 0 },
      nextFollowUpDate: { $lte: todayEnd }
    }),
    Transaction.find({ ownerId })
      .populate("customerId", "name phone")
      .sort({ date: -1, createdAt: -1 })
      .limit(8),
    Transaction.aggregate([
      {
        $match: {
          ownerId,
          type: "payment",
          date: { $gte: new Date(currentMonthStart.getFullYear() - 1, currentMonthStart.getMonth(), 1) }
        }
      },
      { $group: { _id: monthLabelExpression(), total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", total: 1 } }
    ]),
    Transaction.aggregate([
      {
        $match: {
          ownerId,
          type: "credit",
          date: { $gte: new Date(currentMonthStart.getFullYear() - 1, currentMonthStart.getMonth(), 1) }
        }
      },
      { $group: { _id: monthLabelExpression(), total: { $sum: "$amount" } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: "$_id", total: 1 } }
    ]),
    Customer.aggregate([
      { $match: { ownerId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { _id: 0, status: "$_id", count: 1 } }
    ]),
    Customer.find({ ownerId, status: "active", totalDue: { $gt: 0 } })
      .sort({ totalDue: -1 })
      .limit(5)
      .select("name phone totalDue nextFollowUpDate"),
    CustomerReply.find({
      ownerId,
      intent: "promise_to_pay",
      promisedPaymentDate: { $gte: todayStart, $lte: upcomingEnd }
    })
      .populate("customerId", "name phone totalDue")
      .sort({ promisedPaymentDate: 1 })
      .limit(8)
  ]);

  const dueTrend = await Customer.aggregate([
    { $match: { ownerId, status: "active" } },
    {
      $group: {
        _id: {
          hasDue: { $gt: ["$totalDue", 0] }
        },
        amount: { $sum: "$totalDue" },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        label: { $cond: ["$_id.hasDue", "Outstanding", "Settled"] },
        amount: 1,
        count: 1
      }
    }
  ]);

  res.json({
    success: true,
    summary: {
      totalCustomers,
      totalOutstanding: outstandingAgg[0]?.totalOutstanding || 0,
      todayCollections: todayCollectionsAgg[0]?.todayCollections || 0,
      overdueCustomers,
      pendingFollowUps
    },
    recentTransactions,
    monthlyCollections,
    monthlyCredit,
    dueTrend,
    customerDistribution,
    topDebtors,
    upcomingPromises
  });
});
