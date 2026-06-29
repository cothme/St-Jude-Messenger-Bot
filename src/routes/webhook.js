const express = require("express");
const config = require("../config");
const { handleMessageEvent } = require("../bot/messageHandler");
const logger = require("../utils/logger");

const router = express.Router();

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.verifyToken) {
    logger.info("Messenger webhook verified");
    res.status(200).send(challenge);
    return;
  }

  logger.warn("Messenger webhook verification failed", { mode });
  res.sendStatus(403);
});

router.post("/", async (req, res) => {
  const body = req.body;

  if (body.object !== "page") {
    res.sendStatus(404);
    return;
  }

  res.status(200).send("EVENT_RECEIVED");

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (config.pageId && event.recipient && event.recipient.id !== config.pageId) {
        logger.warn("Ignoring Messenger event for unexpected page", {
          pageId: event.recipient.id
        });
        continue;
      }

      if (event.message && event.message.is_echo) {
        continue;
      }

      if (event.message || event.postback) {
        await handleMessageEvent(event);
      }
    }
  }
});

module.exports = router;
