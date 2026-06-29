const fs = require("fs/promises");
const path = require("path");
const config = require("../config");
const logger = require("../utils/logger");

async function ensureStorageFile() {
  const filePath = path.resolve(config.inquiriesFile);
  const directory = path.dirname(filePath);

  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(filePath);
  } catch (_error) {
    await fs.writeFile(filePath, "[]\n", "utf8");
  }

  return filePath;
}

async function readInquiries(filePath) {
  const raw = await fs.readFile(filePath, "utf8");

  if (!raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.error("Inquiry file contains invalid JSON", { error: error.message });
    throw error;
  }
}

async function saveInquiry(inquiry) {
  const filePath = await ensureStorageFile();
  const inquiries = await readInquiries(filePath);
  const record = {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...inquiry
  };

  inquiries.push(record);
  await fs.writeFile(filePath, `${JSON.stringify(inquiries, null, 2)}\n`, "utf8");

  return record;
}

module.exports = {
  saveInquiry
};
