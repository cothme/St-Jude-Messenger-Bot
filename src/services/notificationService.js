const config = require("../config");
const logger = require("../utils/logger");

const PROVIDERS = new Set(["none", "slack"]);

function truncate(value, limit = 1200) {
  const text = String(value || "");
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function formatAnswers(answers = {}) {
  const entries = Object.entries(answers).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  });

  if (!entries.length) return "No structured answers captured yet.";

  return entries
    .map(([key, value]) => `- ${key}: ${truncate(value, 220)}`)
    .join("\n");
}

function slackPayload(inquiry) {
  const text = [
    "*New Messenger inquiry saved*",
    `Type: ${inquiry.type || "unknown"}`,
    `Status: ${inquiry.status || "new"}`,
    `Inquiry ID: ${inquiry.id}`,
    `Messenger user ID: ${inquiry.messengerUserId}`,
    `Created: ${inquiry.createdAt}`,
    "",
    "*Captured details*",
    formatAnswers(inquiry.answers)
  ].join("\n");

  return {
    text: truncate(text, 3000)
  };
}

async function sendSlackNotification(inquiry) {
  const response = await fetch(config.notifications.slackWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(slackPayload(inquiry))
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack notification failed with status ${response.status}: ${truncate(body, 300)}`);
  }
}

async function notifyNewInquiry(inquiry) {
  const provider = config.notifications.provider;

  if (provider === "none") return;

  try {
    if (provider === "slack") {
      await sendSlackNotification(inquiry);
      logger.info("New inquiry notification sent", {
        provider,
        inquiryId: inquiry.id
      });
      return;
    }

    logger.warn("New inquiry notification skipped because provider is unsupported", {
      provider,
      inquiryId: inquiry.id
    });
  } catch (error) {
    logger.error("Failed to send new inquiry notification", {
      provider,
      inquiryId: inquiry.id,
      error: error.message
    });
  }
}

function isSupportedNotificationProvider(provider) {
  return PROVIDERS.has(provider);
}

module.exports = {
  isSupportedNotificationProvider,
  notifyNewInquiry
};
