const express = require("express");
const morgan = require("morgan");
const config = require("./config");
const webhookRouter = require("./routes/webhook");
const {
  buildGeneralRateLimit,
  buildWebhookRateLimit,
  captureRawBody,
  helmet,
  verifyMetaSignature
} = require("./middleware/security");
const logger = require("./utils/logger");
const { validateConfig } = require("./utils/validateConfig");
const { ensureDatabase } = require("./services/inquiryStore");

const app = express();

app.set("trust proxy", 1);
validateConfig();
ensureDatabase().catch((error) => {
  logger.error("Database initialization failed", { error: error.message });
  process.exit(1);
});

app.use(helmet());
app.use(express.json({
  limit: config.security.jsonBodyLimit,
  verify: captureRawBody
}));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));
app.use(buildGeneralRateLimit());

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "st-jude-messenger-bot",
    message: "St Jude's Messenger bot is running.",
    health: "/health",
    webhook: "/webhook"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "st-jude-messenger-bot"
  });
});

app.use("/webhook", buildWebhookRateLimit(), verifyMetaSignature, webhookRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});

app.use((error, _req, res, _next) => {
  logger.error("Unhandled server error", { error: error.message });
  res.status(500).json({
    error: "Internal server error"
  });
});

const server = app.listen(config.port, () => {
  logger.info(`Messenger bot server listening on port ${config.port}`);
});

function shutdown(signal) {
  logger.info(`Received ${signal}, shutting down`);
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
