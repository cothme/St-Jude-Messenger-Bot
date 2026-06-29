const sessions = new Map();

function createSession(userId) {
  const session = {
    userId,
    ai: {
      topic: null,
      collected: {},
      history: [],
      savedInquiryKeys: []
    },
    updatedAt: new Date().toISOString()
  };

  sessions.set(userId, session);
  return session;
}

function getSession(userId) {
  return sessions.get(userId) || null;
}

function updateSession(userId, updates) {
  const existing = getSession(userId) || createSession(userId);
  const next = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  sessions.set(userId, next);
  return next;
}

function clearSession(userId) {
  sessions.delete(userId);
}

module.exports = {
  getSession,
  updateSession,
  clearSession
};
