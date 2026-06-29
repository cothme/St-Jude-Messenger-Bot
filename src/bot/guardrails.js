const outOfScopePatterns = [
  /\bpython\b/i,
  /\bjavascript\b/i,
  /\btypescript\b/i,
  /\bjava\b/i,
  /\bc\+\+\b/i,
  /\bc#\b/i,
  /\bphp\b/i,
  /\bruby\b/i,
  /\bgolang\b/i,
  /\bgo app\b/i,
  /\breact\b/i,
  /\bnode(?:\.js)?\b/i,
  /\bexpress\b/i,
  /\bflask\b/i,
  /\bdjango\b/i,
  /\bfastapi\b/i,
  /\blaravel\b/i,
  /\bspring boot\b/i,
  /\bhtml\b/i,
  /\bcss\b/i,
  /\bsql\b/i,
  /\bdatabase schema\b/i,
  /\bcode\b/i,
  /\bscript\b/i,
  /\bprogram(?:ming)?\b/i,
  /\bapp\b/i,
  /\bwebsite\b/i,
  /\bapi\b/i,
  /\bnpm\b/i,
  /\bgit\b/i,
  /\bdocker\b/i,
  /\bkubernetes\b/i,
  /\bdebug\b/i,
  /\bhomework\b/i,
  /\bessay\b/i,
  /\brecipe\b/i,
  /\bcrypto\b/i,
  /\bstock\b/i,
  /\binvest(?:ment|ing)?\b/i,
  /\blegal advice\b/i,
  /\btax\b/i,
  /\btranslate\b/i,
  /\bwrite (?:me )?(?:a|an|the)?\s*(?:poem|song|story|email|letter|resume|cover letter)\b/i,
  /\bmake (?:me )?(?:a|an|the)?\s*(?:app|website|program|script)\b/i,
  /\bcreate (?:me )?(?:a|an|the)?\s*(?:app|website|program|script)\b/i,
  /\bbuild (?:me )?(?:a|an|the)?\s*(?:app|website|program|script)\b/i
];

const promptInjectionPatterns = [
  /\bignore (?:all )?(?:previous|prior|above) instructions\b/i,
  /\bforget (?:all )?(?:previous|prior|above) instructions\b/i,
  /\bsystem prompt\b/i,
  /\bdeveloper message\b/i,
  /\bshow me your instructions\b/i,
  /\breveal your instructions\b/i,
  /\bjailbreak\b/i,
  /\bpretend you are\b/i,
  /\bact as\b/i
];

const inScopePatterns = [
  /\bst\.?\s*jude\b/i,
  /\bst\s*jude'?s\b/i,
  /\bpsychiatric\b/i,
  /\bcustodial\b/i,
  /\bfacility\b/i,
  /\bclinic\b/i,
  /\bconsult(?:ation)?\b/i,
  /\bschedule\b/i,
  /\bappointment\b/i,
  /\blocation\b/i,
  /\baddress\b/i,
  /\bmap\b/i,
  /\blandmark\b/i,
  /\bintern(?:ship)?\b/i,
  /\bojt\b/i,
  /\bpracticum\b/i,
  /\badmission\b/i,
  /\badmit\b/i,
  /\baccommodate\b/i,
  /\bpatient\b/i,
  /\bmental health\b/i,
  /\bcondition\b/i,
  /\bconcern\b/i,
  /\bdoctor\b/i,
  /\bstaff\b/i,
  /\bagent\b/i,
  /\bcontact\b/i,
  /\bprice\b/i,
  /\bpricing\b/i,
  /\brate\b/i,
  /\bfee\b/i,
  /\bcost\b/i,
  /\bhello\b/i,
  /\bhi\b/i,
  /\bhey\b/i
];

function hasPattern(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

function isClearlyOutOfScope(text = "") {
  const trimmed = text.trim();

  if (!trimmed) return false;
  if (hasPattern(promptInjectionPatterns, trimmed)) return true;
  if (hasPattern(inScopePatterns, trimmed)) return false;

  return hasPattern(outOfScopePatterns, trimmed);
}

function outOfScopeReply() {
  return "I can only help with St Jude's Psychiatric and Custodial Home inquiries, such as internship, consultation schedule, location, patient accommodation, or contacting staff.";
}

module.exports = {
  isClearlyOutOfScope,
  outOfScopeReply
};
