const config = require("../config");

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
