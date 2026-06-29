const { PAYLOADS } = require("./quickReplies");

function intentFromPayload(payload) {
  const payloadMap = {
    [PAYLOADS.INTERNSHIP]: "internship",
    [PAYLOADS.CONSULTATION]: "consultation",
    [PAYLOADS.LOCATION]: "location",
    [PAYLOADS.ACCOMMODATION]: "accommodation",
    [PAYLOADS.CONTACT_STAFF]: "contactStaff",
    [PAYLOADS.GET_STARTED]: "greeting"
  };

  return payloadMap[payload] || null;
}

module.exports = {
  intentFromPayload
};
