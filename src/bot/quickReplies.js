const { quickReply } = require("../services/messengerClient");

const PAYLOADS = {
  GET_STARTED: "GET_STARTED",
  INTERNSHIP: "FLOW_INTERNSHIP",
  CONSULTATION: "FLOW_CONSULTATION",
  LOCATION: "FLOW_LOCATION",
  ACCOMMODATION: "FLOW_ACCOMMODATION",
  CONTACT_STAFF: "FLOW_CONTACT_STAFF"
};

function mainMenuQuickReplies() {
  return [
    quickReply("Internship", PAYLOADS.INTERNSHIP),
    quickReply("Consultation Schedule", PAYLOADS.CONSULTATION),
    quickReply("Location", PAYLOADS.LOCATION),
    quickReply("Patient Accommodation", PAYLOADS.ACCOMMODATION),
    quickReply("Contact Staff", PAYLOADS.CONTACT_STAFF)
  ];
}

module.exports = {
  PAYLOADS,
  mainMenuQuickReplies
};
