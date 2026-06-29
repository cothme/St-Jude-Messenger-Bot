function formatMeta(meta) {
  if (!meta) return "";

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch (_error) {
    return " [unserializable metadata]";
  }
}

function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}${formatMeta(meta)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta)
};
