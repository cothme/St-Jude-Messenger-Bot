const crisisPatterns = [
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bkill myself\b/i,
  /\bend my life\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt myself\b/i,
  /\bharming myself\b/i,
  /\bviolence\b/i,
  /\bviolent\b/i,
  /\bhurt someone\b/i,
  /\bkill someone\b/i,
  /\bemergency\b/i,
  /\bcrisis\b/i
];

const affirmativePatterns = [
  /\byes\b/i,
  /\boo\b/i,
  /\bopo\b/i,
  /\bcurrently\b/i,
  /\bnow\b/i,
  /\baggressive\b/i,
  /\bself[-\s]?harming\b/i,
  /\bin crisis\b/i
];

function containsCrisisLanguage(text = "") {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

function isAffirmativeCrisisAnswer(text = "") {
  return affirmativePatterns.some((pattern) => pattern.test(text));
}

function emergencyGuidance(contactNumber) {
  return [
    "If there is immediate danger, self-harm, suicide risk, violence, or a medical emergency, please contact local emergency services now or go to the nearest hospital emergency room.",
    `You may also contact St Jude's Psychiatric and Custodial Home at ${contactNumber} for non-emergency coordination once everyone is safe.`,
    "This chatbot cannot provide emergency medical advice or crisis intervention."
  ].join("\n\n");
}

module.exports = {
  containsCrisisLanguage,
  isAffirmativeCrisisAnswer,
  emergencyGuidance
};
