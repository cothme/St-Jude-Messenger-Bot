const config = require("../config");
const logger = require("../utils/logger");

const GRAPH_API_URL = "https://graph.facebook.com/v20.0/me/messages";

function requirePageAccessToken() {
  if (!config.pageAccessToken) {
    throw new Error("PAGE_ACCESS_TOKEN is not configured.");
  }
}

async function callSendApi(payload) {
  requirePageAccessToken();

  const response = await fetch(`${GRAPH_API_URL}?access_token=${config.pageAccessToken}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error("Messenger Send API request failed", {
      status: response.status,
      body
    });
    throw new Error(`Messenger Send API request failed with status ${response.status}`);
  }

  return response.json();
}

function quickReply(title, payload) {
  return {
    content_type: "text",
    title,
    payload
  };
}

async function sendText(recipientId, text, quickReplies = []) {
  return callSendApi({
    recipient: {
      id: recipientId
    },
    message: {
      text,
      ...(quickReplies.length ? { quick_replies: quickReplies } : {})
    }
  });
}

async function sendButtonTemplate(recipientId, text, buttons) {
  return callSendApi({
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text,
          buttons
        }
      }
    }
  });
}

async function showTyping(recipientId, isTyping = true) {
  return callSendApi({
    recipient: {
      id: recipientId
    },
    sender_action: isTyping ? "typing_on" : "typing_off"
  });
}

module.exports = {
  quickReply,
  sendText,
  sendButtonTemplate,
  showTyping
};
