const crypto = require("crypto");
const express = require("express");
const config = require("../config");
const { listInquiries, updateInquiryStatus } = require("../services/inquiryStore");

const router = express.Router();
const STATUSES = new Set(["new", "seen", "followed_up", "resolved"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isLocalRequest(req) {
  const ip = req.ip || req.socket.remoteAddress || "";
  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip);
}

function parseBasicAuth(header = "") {
  if (!header.startsWith("Basic ")) return null;

  try {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");

    if (separator === -1) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch (_error) {
    return null;
  }
}

function requireInboxAccess(req, res, next) {
  if (!config.staffInbox.enabled) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (config.staffInbox.localOnly && !isLocalRequest(req)) {
    res.status(403).send("Staff inbox is only available from localhost.");
    return;
  }

  const credentials = parseBasicAuth(req.get("authorization"));
  const validCredentials =
    credentials &&
    safeEqual(credentials.username, config.staffInbox.username) &&
    safeEqual(credentials.password, config.staffInbox.password);

  if (!validCredentials) {
    res.set("WWW-Authenticate", 'Basic realm="St Jude Staff Inbox"');
    res.status(401).send("Authentication required.");
    return;
  }

  next();
}

function renderAnswers(answers = {}) {
  const entries = Object.entries(answers).filter(([, value]) => {
    if (value === null || value === undefined) return false;
    return String(value).trim() !== "";
  });

  if (!entries.length) {
    return '<span class="muted">No captured answers yet</span>';
  }

  return `<dl>${entries
    .map(([key, value]) => {
      return `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`;
    })
    .join("")}</dl>`;
}

function renderStatusOptions(currentStatus) {
  return [...STATUSES]
    .map((status) => {
      const selected = status === currentStatus ? " selected" : "";
      return `<option value="${escapeHtml(status)}"${selected}>${escapeHtml(status.replace(/_/g, " "))}</option>`;
    })
    .join("");
}

function renderInquiryRow(inquiry) {
  return `
    <article class="inquiry">
      <div class="inquiry-header">
        <div>
          <h2>${escapeHtml(inquiry.type || "Unknown inquiry")}</h2>
          <p>${escapeHtml(inquiry.createdAt || "")}</p>
        </div>
        <span class="status">${escapeHtml(inquiry.status || "new")}</span>
      </div>
      <div class="meta">
        <span>ID: ${escapeHtml(inquiry.id)}</span>
        <span>Messenger user: ${escapeHtml(inquiry.messengerUserId)}</span>
      </div>
      <div class="answers">${renderAnswers(inquiry.answers)}</div>
      <form method="post" action="/staff/inquiries/${encodeURIComponent(inquiry.id)}/status">
        <label>
          Status
          <select name="status">${renderStatusOptions(inquiry.status || "new")}</select>
        </label>
        <button type="submit">Update</button>
      </form>
    </article>
  `;
}

function renderPage(inquiries) {
  const body = inquiries.length
    ? inquiries.map(renderInquiryRow).join("")
    : '<section class="empty">No saved inquiries yet.</section>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Staff Inquiries</title>
  <style>
    :root {
      color-scheme: light;
      font-family: Arial, sans-serif;
      color: #1d252d;
      background: #f5f7f8;
    }

    body {
      margin: 0;
    }

    main {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 48px;
    }

    header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    h1,
    h2,
    p {
      margin: 0;
    }

    h1 {
      font-size: 28px;
    }

    header p,
    .muted,
    .inquiry-header p,
    .meta {
      color: #64717d;
    }

    .inquiry {
      background: #ffffff;
      border: 1px solid #d8e0e5;
      border-radius: 8px;
      padding: 18px;
      margin-top: 12px;
      box-shadow: 0 1px 2px rgba(29, 37, 45, 0.05);
    }

    .inquiry-header,
    .meta,
    form {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    h2 {
      font-size: 18px;
      text-transform: capitalize;
    }

    .status {
      border: 1px solid #8bb8a7;
      background: #eaf6f1;
      color: #215947;
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 13px;
      text-transform: capitalize;
    }

    .meta {
      justify-content: flex-start;
      margin-top: 10px;
      font-size: 13px;
    }

    .answers {
      margin: 16px 0;
    }

    dl {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
      margin: 0;
    }

    dt {
      color: #64717d;
      font-size: 12px;
      text-transform: uppercase;
    }

    dd {
      margin: 3px 0 0;
      overflow-wrap: anywhere;
    }

    label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #3d4a55;
      font-size: 14px;
    }

    select,
    button {
      min-height: 36px;
      border: 1px solid #bbc8d0;
      border-radius: 6px;
      background: #ffffff;
      color: #1d252d;
      font: inherit;
      padding: 0 10px;
    }

    button {
      border-color: #2f6f73;
      background: #2f6f73;
      color: #ffffff;
      cursor: pointer;
    }

    .empty {
      border: 1px dashed #bbc8d0;
      border-radius: 8px;
      padding: 28px;
      color: #64717d;
      background: #ffffff;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Staff Inquiries</h1>
        <p>Newest saved Messenger inquiries</p>
      </div>
      <p>${escapeHtml(inquiries.length)} shown</p>
    </header>
    ${body}
  </main>
</body>
</html>`;
}

router.use(requireInboxAccess);

router.get("/inquiries", async (_req, res, next) => {
  try {
    const inquiries = await listInquiries(100);
    res.type("html").send(renderPage(inquiries));
  } catch (error) {
    next(error);
  }
});

router.post("/inquiries/:id/status", express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    const status = String(req.body.status || "");

    if (!STATUSES.has(status)) {
      res.status(400).send("Unsupported status.");
      return;
    }

    const updated = await updateInquiryStatus(req.params.id, status);

    if (!updated) {
      res.status(404).send("Inquiry not found.");
      return;
    }

    res.redirect("/staff/inquiries");
  } catch (error) {
    next(error);
  }
});

module.exports = router;
