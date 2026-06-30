const config = require("../config");
const { isSupportedNotificationProvider } = require("../services/notificationService");

const placeholderPatterns = [
  /\[[a-z0-9_ -]+\]/i,
  /\breplace[_ -]?with/i,
  /\byour[_ -]/i,
  /\bexample\b/i,
  /\bplaceholder\b/i,
  /\bdummy\b/i,
  /\btest\b/i,
  /\btbd\b/i,
  /\bn\/a\b/i,
  /\bcoming soon\b/i,
  /\bchange me\b/i,
  /\bto be (updated|provided|confirmed|filled|supplied|announced)\b/i,
  /\b(address|contact|phone|number|location|landmark|map|maps) (here|goes here)\b/i
];

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function required(name, value, errors) {
  if (!clean(value)) {
    errors.push(`${name} is required.`);
  }
}

function looksLikePlaceholder(value) {
  return placeholderPatterns.some((pattern) => pattern.test(value));
}

function validateBusinessDetail(name, value, errors, options = {}) {
  const normalized = clean(value);

  if (!normalized) {
    errors.push(`${name} is required.`);
    return;
  }

  if (looksLikePlaceholder(normalized)) {
    errors.push(`${name} must be real St Jude business information, not placeholder text.`);
    return;
  }

  if (options.minLength && normalized.length < options.minLength) {
    errors.push(`${name} is too short to be valid production business information.`);
  }
}

function validateGoogleMapsLink(value, errors) {
  validateBusinessDetail("GOOGLE_MAPS_LINK", value, errors);

  const normalized = clean(value);
  if (!normalized || looksLikePlaceholder(normalized)) return;

  let url;
  try {
    url = new URL(normalized);
  } catch (_error) {
    errors.push("GOOGLE_MAPS_LINK must be a valid Google Maps URL.");
    return;
  }

  const host = url.hostname.toLowerCase();
  const isGoogleMapsHost =
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host === "google.com" ||
    host === "maps.google.com" ||
    host === "www.google.com";

  if (url.protocol !== "https:" || !isGoogleMapsHost) {
    errors.push("GOOGLE_MAPS_LINK must be an HTTPS Google Maps link.");
  }
}

function validateContactNumber(value, errors) {
  validateBusinessDetail("CONTACT_NUMBER", value, errors);

  const normalized = clean(value);
  if (!normalized || looksLikePlaceholder(normalized)) return;

  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7) {
    errors.push("CONTACT_NUMBER must include a real reachable phone number.");
  }
}

function validateProductionBusinessDetails(errors) {
  validateBusinessDetail("BUSINESS_ADDRESS", config.business.address, errors, {
    minLength: 15
  });
  validateGoogleMapsLink(config.business.mapsLink, errors);
  validateContactNumber(config.business.contactNumber, errors);
  validateBusinessDetail("LANDMARK_INSTRUCTIONS", config.business.landmarkInstructions, errors, {
    minLength: 10
  });
}

function validateConfig() {
  const errors = [];

  required("PAGE_ACCESS_TOKEN", config.pageAccessToken, errors);
  required("VERIFY_TOKEN", config.verifyToken, errors);

  if (config.ai.enabled) {
    required("OPENAI_API_KEY", config.ai.apiKey, errors);
  }

  if (config.security.requireMetaSignature) {
    required("META_APP_SECRET", config.metaAppSecret, errors);
  }

  if (!isSupportedNotificationProvider(config.notifications.provider)) {
    errors.push("NOTIFICATION_PROVIDER must be one of: none, slack.");
  }

  if (config.notifications.provider === "slack") {
    required("NOTIFICATION_SLACK_WEBHOOK_URL", config.notifications.slackWebhookUrl, errors);
  }

  if (config.staffInbox.enabled) {
    required("STAFF_INBOX_USERNAME", config.staffInbox.username, errors);
    required("STAFF_INBOX_PASSWORD", config.staffInbox.password, errors);
  }

  if (config.nodeEnv === "production") {
    required("DATABASE_URL", config.databaseUrl, errors);
    validateProductionBusinessDetails(errors);
  }

  if (errors.length) {
    throw new Error(`Invalid configuration: ${errors.join(" ")}`);
  }
}

module.exports = {
  validateConfig
};
