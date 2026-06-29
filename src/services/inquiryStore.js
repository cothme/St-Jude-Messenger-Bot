const fs = require("fs/promises");
const path = require("path");
const { Pool } = require("pg");
const config = require("../config");
const logger = require("../utils/logger");

let pool = null;
let databaseReady = false;

function usePostgres() {
  return Boolean(config.databaseUrl);
}

function getPool() {
  if (!usePostgres()) return null;

  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : false
    });
  }

  return pool;
}

async function ensureDatabase() {
  if (!usePostgres() || databaseReady) return;

  const client = getPool();

  await client.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      messenger_user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS inquiries_created_at_idx
    ON inquiries (created_at DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS inquiries_type_idx
    ON inquiries (type)
  `);

  databaseReady = true;
}

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
  if (usePostgres()) {
    await ensureDatabase();

    const record = {
      id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...inquiry
    };

    await getPool().query(
      `
        INSERT INTO inquiries (
          id,
          messenger_user_id,
          type,
          answers,
          status,
          created_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5, $6)
      `,
      [
        record.id,
        record.messengerUserId,
        record.type,
        JSON.stringify(record.answers || {}),
        record.status || "new",
        record.createdAt
      ]
    );

    return record;
  }

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

async function listInquiries(limit = 100) {
  if (usePostgres()) {
    await ensureDatabase();

    const result = await getPool().query(
      `
        SELECT
          id,
          messenger_user_id,
          type,
          answers,
          status,
          created_at
        FROM inquiries
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      messengerUserId: row.messenger_user_id,
      type: row.type,
      answers: row.answers || {},
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    }));
  }

  const filePath = await ensureStorageFile();
  const inquiries = await readInquiries(filePath);

  return inquiries
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, limit);
}

async function updateInquiryStatus(id, status) {
  if (usePostgres()) {
    await ensureDatabase();

    const result = await getPool().query(
      `
        UPDATE inquiries
        SET status = $2
        WHERE id = $1
        RETURNING id
      `,
      [id, status]
    );

    return result.rowCount > 0;
  }

  const filePath = await ensureStorageFile();
  const inquiries = await readInquiries(filePath);
  const index = inquiries.findIndex((inquiry) => inquiry.id === id);

  if (index === -1) return false;

  inquiries[index] = {
    ...inquiries[index],
    status
  };

  await fs.writeFile(filePath, `${JSON.stringify(inquiries, null, 2)}\n`, "utf8");

  return true;
}

module.exports = {
  ensureDatabase,
  listInquiries,
  updateInquiryStatus,
  saveInquiry
};
