import bcrypt from "bcryptjs";
import { connectDB, disconnectDB } from "../config/db.js";
import { env } from "../config/env.js";
import Customer from "../models/Customer.js";
import CustomerReply from "../models/CustomerReply.js";
import Reminder from "../models/Reminder.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { createLedgerTransaction } from "../services/ledgerService.js";
import { addDays } from "../utils/dates.js";

if (env.isProduction && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  console.error("Refusing to seed production without ALLOW_PRODUCTION_SEED=true.");
  process.exit(1);
}

const customers = [
  ["Aarav General Store", "9000000001", 12000, 3000, -3],
  ["Meera Textiles", "9000000002", 8500, 2500, 2],
  ["Kabir Hardware", "9000000003", 5000, 5000, 5],
  ["Nisha Foods", "9000000004", 17500, 7500, -1],
  ["Om Stationery", "9000000005", 2200, 2200, 0],
  ["Pragati Mart", "9000000006", 31000, 9000, 4],
  ["Riya Boutique", "9000000007", 7200, 0, -5],
  ["Sahil Electronics", "9000000008", 15000, 6000, 7],
  ["Tara Pharmacy", "9000000009", 0, 0, 10],
  ["Uday Agro", "9000000010", 9500, 3500, 1]
];

function dated(daysAgo) {
  return addDays(new Date(), -daysAgo);
}

async function main() {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash("Demo@12345", 12);
  const user = await User.findOneAndUpdate(
    { email: "demo@smeos.local" },
    {
      name: "Demo Owner",
      businessName: "SMEOS Demo Store",
      email: "demo@smeos.local",
      phone: "9000000000",
      passwordHash,
      preferredLanguage: "hi"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    Customer.deleteMany({ ownerId: user._id }),
    Transaction.deleteMany({ ownerId: user._id }),
    Reminder.deleteMany({ ownerId: user._id }),
    CustomerReply.deleteMany({ ownerId: user._id })
  ]);

  for (const [name, phone, credit, payment, followUpOffset] of customers) {
    const customer = await Customer.create({
      ownerId: user._id,
      name,
      phone,
      address: "Demo market area",
      creditLimit: Math.max(credit * 2, 10000),
      paymentTermsDays: 7,
      nextFollowUpDate: addDays(new Date(), followUpOffset),
      notes: "Synthetic seed customer",
      status: credit === payment ? "active" : "active"
    });

    if (credit > 0) {
      await createLedgerTransaction(user._id, {
        customerId: customer._id,
        type: "credit",
        amount: credit,
        description: "Seed opening credit",
        date: dated(90 - followUpOffset)
      });
    }

    if (payment > 0) {
      await createLedgerTransaction(user._id, {
        customerId: customer._id,
        type: "payment",
        amount: Math.min(payment, credit),
        description: "Seed partial payment",
        paymentMethod: "UPI",
        date: dated(Math.max(0, 20 - followUpOffset))
      });
    }

    await Reminder.create({
      ownerId: user._id,
      customerId: customer._id,
      message: `Namaste ${name}, pending balance ke liye payment update share kar dein.`,
      language: "hinglish",
      tone: "polite",
      status: followUpOffset < 0 ? "sent" : "generated",
      generatedBy: "template"
    });

    if (followUpOffset >= 0 && credit > payment) {
      await CustomerReply.create({
        ownerId: user._id,
        customerId: customer._id,
        originalMessage: "Kal payment kar dunga",
        intent: "promise_to_pay",
        promisedPaymentDate: addDays(new Date(), Math.max(1, followUpOffset)),
        extractedAmount: null,
        confidence: 0.96,
        language: "hi",
        summary: "Customer promised to pay soon.",
        suggestedAction: "Follow up on the promised date.",
        rawAIResponse: { source: "seed" }
      });
    }
  }

  console.log("Seed complete.");
  console.log("Demo email: demo@smeos.local");
  console.log("Demo password: Demo@12345");
  await disconnectDB();
}

main().catch(async (error) => {
  console.error(`Seed failed: ${error.message}`);
  await disconnectDB();
  process.exit(1);
});
