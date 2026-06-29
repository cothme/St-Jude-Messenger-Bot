require("dotenv").config();

function booleanFromEnv(value, fallback) {
  if (value === undefined || value === "") return fallback;
  return value === "true";
}

const nodeEnv = process.env.NODE_ENV || "development";

const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv,
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN || "",
  verifyToken: process.env.VERIFY_TOKEN || "",
  metaAppSecret: process.env.META_APP_SECRET || "",
  pageId: process.env.PAGE_ID || "",
  security: {
    requireMetaSignature: booleanFromEnv(
      process.env.REQUIRE_META_SIGNATURE,
      nodeEnv === "production"
    ),
    jsonBodyLimit: process.env.JSON_BODY_LIMIT || "256kb",
    generalRateLimitWindowMs: Number(process.env.GENERAL_RATE_LIMIT_WINDOW_MS || 900000),
    generalRateLimitMax: Number(process.env.GENERAL_RATE_LIMIT_MAX || 600),
    webhookRateLimitWindowMs: Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS || 60000),
    webhookRateLimitMax: Number(process.env.WEBHOOK_RATE_LIMIT_MAX || 300)
  },
  ai: {
    enabled: process.env.AI_ENABLED !== "false",
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    maxOutputTokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 160)
  },
  business: {
    name: "St Jude's Psychiatric and Custodial Home",
    address: process.env.BUSINESS_ADDRESS || "[BUSINESS_ADDRESS]",
    mapsLink: process.env.GOOGLE_MAPS_LINK || "[GOOGLE_MAPS_LINK]",
    contactNumber: process.env.CONTACT_NUMBER || "[CONTACT_NUMBER]",
    landmarkInstructions:
      process.env.LANDMARK_INSTRUCTIONS || "Landmark instructions: [LANDMARK_INSTRUCTIONS]"
  },
  notifications: {
    provider: (process.env.NOTIFICATION_PROVIDER || "none").toLowerCase(),
    slackWebhookUrl: process.env.NOTIFICATION_SLACK_WEBHOOK_URL || ""
  },
  staffInbox: {
    enabled: booleanFromEnv(process.env.STAFF_INBOX_ENABLED, false),
    username: process.env.STAFF_INBOX_USERNAME || "",
    password: process.env.STAFF_INBOX_PASSWORD || "",
    localOnly: booleanFromEnv(process.env.STAFF_INBOX_LOCAL_ONLY, true)
  },
  inquiriesFile: process.env.INQUIRIES_FILE || "./data/inquiries.json",
  knowledgeBaseFile: process.env.KNOWLEDGE_BASE_FILE || "./knowledge/st-judes-reference.md",
  databaseUrl: process.env.DATABASE_URL || "",
  databaseSsl: booleanFromEnv(process.env.DATABASE_SSL, false)
};

module.exports = config;
