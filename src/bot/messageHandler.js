const config = require("../config");
const { intentFromPayload } = require("./intent");
const { mainMenuQuickReplies } = require("./quickReplies");
const { containsCrisisLanguage, emergencyGuidance } = require("./safety");
const { isClearlyOutOfScope, outOfScopeReply } = require("./guardrails");
const { clearSession, getSession, updateSession } = require("../services/sessionStore");
const { generateAiConversation } = require("../services/aiService");
const { saveInquiry } = require("../services/inquiryStore");
const { notifyNewInquiry } = require("../services/notificationService");
const messenger = require("../services/messengerClient");
const logger = require("../utils/logger");

function greetingText() {
  return `Hello, this is ${config.business.name}. How can I help?`;
}

async function sendGreeting(senderId) {
  await messenger.sendText(senderId, greetingText(), mainMenuQuickReplies());
}

function isGenericGreeting(text = "") {
  const normalized = text.trim().toLowerCase().replace(/[!.?,\s]+$/g, "");

  return [
    "hello",
    "hi",
    "hey",
    "good morning",
    "good afternoon",
    "good evening",
    "kumusta",
    "kamusta"
  ].includes(normalized);
}

function isBusinessHoursQuestion(text = "") {
  const normalized = text.trim().toLowerCase();

  if (!normalized) return false;

  const mentionsHours =
    /\bopen\b/.test(normalized) ||
    /\boffice hours?\b/.test(normalized) ||
    /\boperating hours?\b/.test(normalized) ||
    /\bbusiness hours?\b/.test(normalized) ||
    /\bwhat time\b/.test(normalized) ||
    /\bdaily\b/.test(normalized) ||
    /\btoday\b/.test(normalized);

  const asksAvailability =
    /\bare you\b/.test(normalized) ||
    /\bdo you\b/.test(normalized) ||
    /\bcan i\b/.test(normalized) ||
    /\bwhen\b/.test(normalized) ||
    /\bwhat time\b/.test(normalized) ||
    /\bhours?\b/.test(normalized);

  return mentionsHours && asksAvailability;
}

function businessHoursReply() {
  return "Our office hours are daily from 9:00 AM to 5:00 PM. Admissions may be available 24/7, subject to staff assessment and availability. You may contact 09992206813 before visiting to confirm.";
}

async function sendSafetyNotice(senderId) {
  await messenger.sendText(senderId, emergencyGuidance(config.business.contactNumber));
}

function userTextFromIntent(intent) {
  const labels = {
    internship: "I want to ask about internship.",
    consultation: "I want to ask about consultation schedule.",
    location: "I want to know the location.",
    accommodation: "I want to ask if the facility can accommodate a patient.",
    contactStaff: "I want to contact staff.",
    greeting: "Hello"
  };

  return labels[intent] || "";
}

function inquirySaveKey(result) {
  return `${result.inquiryType}:${JSON.stringify(result.collected || {})}`;
}

async function maybeSaveAiInquiry(senderId, session, result) {
  if (!result.shouldSaveInquiry || !result.inquiryType) {
    logger.info("AI-guided inquiry not saved", {
      reason: !result.shouldSaveInquiry ? "ai_did_not_request_save" : "missing_inquiry_type",
      topic: result.topic,
      status: result.status,
      shouldSaveInquiry: result.shouldSaveInquiry,
      inquiryType: result.inquiryType,
      collectedFields: Object.keys(result.collected || {})
    });
    return session.ai.savedInquiryKeys || [];
  }

  const key = inquirySaveKey(result);
  const savedKeys = session.ai.savedInquiryKeys || [];

  if (savedKeys.includes(key)) {
    logger.info("AI-guided inquiry save skipped", {
      reason: "duplicate_in_session",
      topic: result.topic,
      inquiryType: result.inquiryType,
      status: result.status,
      collectedFields: Object.keys(result.collected || {})
    });
    return savedKeys;
  }

  logger.info("AI-guided inquiry save requested", {
    topic: result.topic,
    inquiryType: result.inquiryType,
    status: result.status,
    collectedFields: Object.keys(result.collected || {})
  });

  const record = await saveInquiry({
    messengerUserId: senderId,
    type: result.inquiryType,
    answers: result.collected,
    status: result.status === "urgent_crisis_guidance_given" ? result.status : "new"
  });

  logger.info("AI-guided inquiry saved", {
    inquiryId: record.id,
    type: result.inquiryType,
    status: record.status,
    collectedFields: Object.keys(record.answers || {})
  });

  await notifyNewInquiry(record);

  return [...savedKeys, key];
}

async function handleAiConversation(senderId, userMessage, selectedTopic = null) {
  const session = getSession(senderId) || updateSession(senderId, {});
  const result = await generateAiConversation({
    userMessage,
    selectedTopic,
    session
  });

  if (!result) {
    await messenger.sendText(
      senderId,
      "Sorry, I could not process that clearly right now. Please choose a topic or leave your contact number and concern for our staff.",
      mainMenuQuickReplies()
    );
    return;
  }

  const savedInquiryKeys = await maybeSaveAiInquiry(senderId, session, result);
  const nextHistory = [
    ...(session.ai.history || []),
    { role: "user", content: userMessage },
    { role: "assistant", content: result.reply }
  ].slice(-12);

  updateSession(senderId, {
    ai: {
      topic: result.topic,
      collected: result.collected,
      history: nextHistory,
      savedInquiryKeys
    }
  });

  await messenger.sendText(senderId, result.reply, mainMenuQuickReplies());
}

async function handleMessageEvent(event) {
  const senderId = event.sender && event.sender.id;

  if (!senderId) return;

  const messageText = event.message && event.message.text;
  const quickReplyPayload = event.message && event.message.quick_reply && event.message.quick_reply.payload;
  const postbackPayload = event.postback && event.postback.payload;
  const payload = quickReplyPayload || postbackPayload;

  try {
    await messenger.showTyping(senderId, true);

    if (messageText && containsCrisisLanguage(messageText)) {
      clearSession(senderId);
      await sendSafetyNotice(senderId);
      return;
    }

    const payloadIntent = payload ? intentFromPayload(payload) : null;

    if (payloadIntent === "greeting") {
      clearSession(senderId);
      await sendGreeting(senderId);
      return;
    }

    if (payloadIntent) {
      await handleAiConversation(senderId, userTextFromIntent(payloadIntent), payloadIntent);
      return;
    }

    if (messageText) {
      if (isGenericGreeting(messageText)) {
        clearSession(senderId);
        await sendGreeting(senderId);
        return;
      }

      if (isBusinessHoursQuestion(messageText)) {
        await messenger.sendText(senderId, businessHoursReply(), mainMenuQuickReplies());
        return;
      }

      if (isClearlyOutOfScope(messageText)) {
        await messenger.sendText(senderId, outOfScopeReply(), mainMenuQuickReplies());
        return;
      }

      await handleAiConversation(senderId, messageText);
      return;
    }

    await sendGreeting(senderId);
  } catch (error) {
    logger.error("Failed to handle Messenger event", {
      senderId,
      error: error.message
    });
    await messenger.sendText(
      senderId,
      "Sorry, something went wrong while processing your message. Please try again or contact our staff directly.",
      mainMenuQuickReplies()
    );
  } finally {
    try {
      await messenger.showTyping(senderId, false);
    } catch (error) {
      logger.warn("Failed to turn typing indicator off", { error: error.message });
    }
  }
}

module.exports = {
  handleMessageEvent,
  sendGreeting
};
