const config = require("../config");
const { intentFromPayload } = require("./intent");
const { mainMenuQuickReplies } = require("./quickReplies");
const { containsCrisisLanguage, emergencyGuidance } = require("./safety");
const { isClearlyOutOfScope, outOfScopeReply } = require("./guardrails");
const { clearSession, getSession, updateSession } = require("../services/sessionStore");
const { generateAiConversation } = require("../services/aiService");
const { saveInquiry } = require("../services/inquiryStore");
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
    return session.ai.savedInquiryKeys || [];
  }

  const key = inquirySaveKey(result);
  const savedKeys = session.ai.savedInquiryKeys || [];

  if (savedKeys.includes(key)) {
    return savedKeys;
  }

  const record = await saveInquiry({
    messengerUserId: senderId,
    type: result.inquiryType,
    answers: result.collected,
    status: result.status === "urgent_crisis_guidance_given" ? result.status : "new"
  });

  logger.info("AI-guided inquiry saved", {
    inquiryId: record.id,
    type: result.inquiryType
  });

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
