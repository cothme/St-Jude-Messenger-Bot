const config = require("../config");
const { isSupportedNotificationProvider } = require("../services/notificationService");

function required(name, value, errors) {
  if (!value) {
    errors.push(`${name} is required.`);
  }
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
  }

  if (errors.length) {
    throw new Error(`Invalid configuration: ${errors.join(" ")}`);
  }
}

module.exports = {
  validateConfig
};
