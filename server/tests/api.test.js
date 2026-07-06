import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "node:path";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { resolveRelativeDate } from "../services/ai/dateResolver.js";

let app;
let mongo;

async function registerOwner(email = "owner@example.com") {
  const agent = request.agent(app);
  const response = await agent.post("/api/auth/register").send({
    name: "Owner",
    businessName: "Owner Store",
    email,
    phone: "9999999999",
    password: "Demo@12345",
    preferredLanguage: "hi"
  });
  expect(response.status).toBe(201);
  return { agent, user: response.body.user };
}

async function createCustomer(agent, overrides = {}) {
  const response = await agent.post("/api/customers").send({
    name: "Ramesh",
    phone: "9000000001",
    paymentTermsDays: 7,
    ...overrides
  });
  expect(response.status).toBe(201);
  return response.body.customer;
}

async function createTransaction(agent, payload) {
  const response = await agent.post("/api/transactions").send(payload);
  expect(response.status).toBe(201);
  return response.body;
}

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "5000";
  process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
  process.env.JWT_EXPIRES_IN = "7d";
  process.env.CLIENT_URL = "http://localhost:5173";
  process.env.DEMO_AI_MODE = "true";
  process.env.GEMINI_API_KEY = "";
  process.env.GEMINI_MODEL = "";
  process.env.MONGOMS_DOWNLOAD_DIR = path.join(process.cwd(), ".mongodb-binaries");
  process.env.MONGOMS_PREFER_GLOBAL_PATH = "false";

  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const imported = await import("../app.js");
  app = imported.default;
  await mongoose.connect(mongo.getUri());
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe("health and auth", () => {
  it("reports connected health", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.database).toBe("connected");
    expect(response.body.demoAiMode).toBe(true);
    expect(response.body.gemini).toBe("not configured");
  });

  it("registers, logs in, rejects duplicates, hides hashes, and protects routes", async () => {
    const { agent } = await registerOwner("auth@example.com");

    const duplicate = await request(app).post("/api/auth/register").send({
      name: "Owner Two",
      businessName: "Other Store",
      email: "auth@example.com",
      password: "Demo@12345"
    });
    expect(duplicate.status).toBe(409);

    const me = await agent.get("/api/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.passwordHash).toBeUndefined();

    const login = await request.agent(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "Demo@12345"
    });
    expect(login.status).toBe(200);
    expect(login.headers["set-cookie"].join(";")).toContain("HttpOnly");

    const rejected = await request(app).get("/api/customers");
    expect(rejected.status).toBe(401);
  });
});

describe("customers", () => {
  it("creates customers, rejects duplicate phones, filters, and isolates owners", async () => {
    const ownerOne = await registerOwner("one@example.com");
    const ownerTwo = await registerOwner("two@example.com");

    const customer = await createCustomer(ownerOne.agent, {
      name: "Ramesh",
      phone: "9000000001"
    });

    const duplicate = await ownerOne.agent.post("/api/customers").send({
      name: "Duplicate",
      phone: "9000000001"
    });
    expect(duplicate.status).toBe(409);

    const missingPhone = await ownerOne.agent.post("/api/customers").send({
      name: "No Phone"
    });
    expect(missingPhone.status).toBe(400);
    expect(missingPhone.body.details.fieldErrors.phone[0]).toContain("Phone is required");

    const filtered = await ownerOne.agent.get("/api/customers?search=Ram&outstanding=false");
    expect(filtered.status).toBe(200);
    expect(filtered.body.customers).toHaveLength(1);

    const hidden = await ownerTwo.agent.get(`/api/customers/${customer._id}`);
    expect(hidden.status).toBe(404);
  });

  it("marks a customer inactive instead of deleting when transactions exist", async () => {
    const { agent } = await registerOwner("delete@example.com");
    const customer = await createCustomer(agent);
    await createTransaction(agent, {
      customerId: customer._id,
      type: "credit",
      amount: 1000
    });

    const deleted = await agent.delete(`/api/customers/${customer._id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.customer.status).toBe("inactive");
  });
});

describe("transactions and dashboard", () => {
  it("handles credit, partial payment, overpayment rejection, deletion, and running ledger", async () => {
    const { agent } = await registerOwner("ledger@example.com");
    const customer = await createCustomer(agent);

    const credit = await createTransaction(agent, {
      customerId: customer._id,
      type: "credit",
      amount: 5000,
      description: "Udhar"
    });
    expect(credit.customer.totalDue).toBe(5000);
    expect(credit.customer.totalPaid).toBe(0);

    const payment = await createTransaction(agent, {
      customerId: customer._id,
      type: "payment",
      amount: 2000,
      paymentMethod: "cash"
    });
    expect(payment.customer.totalDue).toBe(3000);
    expect(payment.customer.totalPaid).toBe(2000);

    const overpayment = await agent.post("/api/transactions").send({
      customerId: customer._id,
      type: "payment",
      amount: 4000
    });
    expect(overpayment.status).toBe(400);

    const afterReject = await agent.get(`/api/customers/${customer._id}`);
    expect(afterReject.body.customer.totalDue).toBe(3000);

    const ledger = await agent.get(`/api/transactions/customer/${customer._id}`);
    expect(ledger.status).toBe(200);
    expect(ledger.body.transactions.map((transaction) => transaction.runningBalance)).toEqual([5000, 3000]);

    const deleted = await agent.delete(`/api/transactions/${payment.transaction._id}`);
    expect(deleted.status).toBe(200);
    expect(deleted.body.customer.totalDue).toBe(5000);
    expect(deleted.body.customer.totalPaid).toBe(0);
  });

  it("updates dashboard metrics from customers, transactions, and promise analysis", async () => {
    const { agent } = await registerOwner("dashboard@example.com");
    const customer = await createCustomer(agent, {
      nextFollowUpDate: new Date().toISOString()
    });
    await createTransaction(agent, {
      customerId: customer._id,
      type: "credit",
      amount: 5000
    });

    const analysis = await agent.post("/api/ai/analyze-reply").send({
      customerId: customer._id,
      message: "Kal payment kar dunga",
      referenceDate: new Date().toISOString()
    });
    expect(analysis.status).toBe(201);
    expect(analysis.body.analysis.intent).toBe("promise_to_pay");

    const dashboard = await agent.get("/api/dashboard");
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.summary.totalCustomers).toBe(1);
    expect(dashboard.body.summary.totalOutstanding).toBe(5000);
    expect(dashboard.body.topDebtors[0].name).toBe("Ramesh");
  });
});

describe("AI services", () => {
  it("generates deterministic reminder fallback with the exact balance", async () => {
    const { agent } = await registerOwner("reminder@example.com");
    const customer = await createCustomer(agent);
    await createTransaction(agent, {
      customerId: customer._id,
      type: "credit",
      amount: 5000
    });

    const response = await agent.post("/api/ai/generate-reminder").send({
      customerId: customer._id,
      language: "hinglish",
      tone: "polite"
    });

    expect(response.status).toBe(201);
    expect(response.body.generatedBy).toBe("template");
    expect(response.body.message).toContain("Ramesh");
    expect(response.body.message).toContain("5,000");
  });

  it("validates reply intent, relative dates, and low-confidence review", async () => {
    expect(resolveRelativeDate("Kal payment kar dunga", new Date("2026-07-04T00:00:00.000Z"))).toBe("2026-07-05");

    const { agent } = await registerOwner("reply@example.com");
    const customer = await createCustomer(agent);

    const promise = await agent.post("/api/ai/analyze-reply").send({
      customerId: customer._id,
      message: "Kal payment kar dunga",
      referenceDate: "2026-07-04T00:00:00.000Z"
    });
    expect(promise.status).toBe(201);
    expect(promise.body.analysis.intent).toBe("promise_to_pay");
    expect(promise.body.analysis.promisedPaymentDate).toBe("2026-07-05");
    expect(promise.body.nextFollowUpUpdated).toBe(true);

    const paymentClaim = await agent.post("/api/ai/analyze-reply").send({
      customerId: customer._id,
      message: "Payment kar diya"
    });
    expect(paymentClaim.status).toBe(201);
    expect(paymentClaim.body.analysis.intent).toBe("payment_completed");
    expect(paymentClaim.body.nextFollowUpUpdated).toBe(false);

    const ledger = await agent.get(`/api/transactions/customer/${customer._id}`);
    expect(ledger.body.transactions).toHaveLength(0);

    const unknown = await agent.post("/api/ai/analyze-reply").send({
      customerId: customer._id,
      message: "Aaj mausam accha hai"
    });
    expect(unknown.status).toBe(201);
    expect(unknown.body.analysis.intent).toBe("unknown");
    expect(unknown.body.analysis.requiresManualReview).toBe(true);
  });

  it("answers supported assistant queries and rejects unsupported ones", async () => {
    const { agent } = await registerOwner("assistant@example.com");
    const customer = await createCustomer(agent, { name: "Ramesh" });
    await createTransaction(agent, {
      customerId: customer._id,
      type: "credit",
      amount: 12000
    });

    const answer = await agent.post("/api/ai/assistant").send({
      question: "Who owes me the most?"
    });
    expect(answer.status).toBe(200);
    expect(answer.body.answer).toContain("Ramesh");

    const unsupported = await agent.post("/api/ai/assistant").send({
      question: "Write arbitrary MongoDB query"
    });
    expect(unsupported.status).toBe(400);
  });

  it("returns empty business insights without data", async () => {
    const { agent } = await registerOwner("insights@example.com");
    const response = await agent.post("/api/ai/business-insights").send({});
    expect(response.status).toBe(200);
    expect(response.body.insights).toEqual([]);
  });
});
