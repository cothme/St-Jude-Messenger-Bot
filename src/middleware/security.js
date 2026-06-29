const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const config = require("../config");
const logger = require("../utils/logger");

function captureRawBody(req, _res, buffer) {
  if (buffer && buffer.length) {
    req.rawBody = Buffer.from(buffer);
  }
}

function verifyMetaSignature(req, res, next) {
  if (req.method !== "POST") {
    return next();
  }

  if (!config.security.requireMetaSignature) {
    return next();
  }

  const signature = req.get("x-hub-signature-256");

  if (!signature) {
    logger.warn("Missing Meta webhook signature");
    return res.sendStatus(401);
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", config.metaAppSecret)
    .update(req.rawBody || Buffer.alloc(0))
    .digest("hex")}`;

  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    logger.warn("Invalid Meta webhook signature");
    return res.sendStatus(401);
  }

  return next();
}

function buildGeneralRateLimit() {
  return rateLimit({
    windowMs: config.security.generalRateLimitWindowMs,
    limit: config.security.generalRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health"
  });
}

function buildWebhookRateLimit() {
  return rateLimit({
    windowMs: config.security.webhookRateLimitWindowMs,
    limit: config.security.webhookRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false
  });
}

module.exports = {
  buildGeneralRateLimit,
  buildWebhookRateLimit,
  captureRawBody,
  helmet,
  verifyMetaSignature
};
