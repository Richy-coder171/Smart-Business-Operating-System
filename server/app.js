import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { isDbConnected } from "./config/db.js";
import { env } from "./config/env.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimiters.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { hasGeminiConfig } from "./services/ai/geminiClient.js";
import aiRoutes from "./routes/aiRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not allowed."));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(apiLimiter);

if (!env.isTest) {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? "healthy" : "degraded",
    database: connected ? "connected" : "disconnected",
    demoAiMode: env.demoAiMode,
    gemini: hasGeminiConfig() ? "configured" : "not configured",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
