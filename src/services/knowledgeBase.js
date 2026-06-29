const fs = require("fs");
const path = require("path");
const config = require("../config");
const logger = require("../utils/logger");

let cachedKnowledge = null;

function loadKnowledgeBase() {
  if (cachedKnowledge !== null) {
    return cachedKnowledge;
  }

  const filePath = path.resolve(config.knowledgeBaseFile);

  try {
    cachedKnowledge = fs.readFileSync(filePath, "utf8").trim();
  } catch (error) {
    logger.warn("Knowledge base file could not be loaded", {
      filePath,
      error: error.message
    });
    cachedKnowledge = "";
  }

  return cachedKnowledge;
}

module.exports = {
  loadKnowledgeBase
};
