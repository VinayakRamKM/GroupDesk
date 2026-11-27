export type ChatMessage = {
  at: string | null;
  sender: string;
  text: string;
};

const TIME = String.raw`(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[ap]\.?m\.?)?)`;
const DATE = String.raw`(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})`;
const HEADER_TIME_FIRST = new RegExp(
  `^\\[${TIME},\\s*${DATE}\\]\\s*([^:]+):\\s?(.*)$`,
  "i",
);
const HEADER_DATE_FIRST = new RegExp(
  `^\\[${DATE},\\s*${TIME}\\]\\s*([^:]+):\\s?(.*)$`,
  "i",
);
const HEADER_ANDROID = new RegExp(
  `^${DATE},\\s*${TIME}\\s[-–—]\\s([^:]+):\\s?(.*)$`,
  "i",
);

function matchHeader(line: string) {
  const timeFirst = line.match(HEADER_TIME_FIRST);
  if (timeFirst) {
    return {
      at: `${timeFirst[2]} ${timeFirst[1]}`,
      sender: timeFirst[3].trim(),
      text: (timeFirst[4] || "").trim(),
    };
  }
  const dateFirst = line.match(HEADER_DATE_FIRST);
  if (dateFirst) {
    return {
      at: `${dateFirst[1]} ${dateFirst[2]}`,
      sender: dateFirst[3].trim(),
      text: (dateFirst[4] || "").trim(),
    };
  }
  const android = line.match(HEADER_ANDROID);
  if (android) {
    return {
      at: `${android[1]} ${android[2]}`,
      sender: android[3].trim(),
      text: (android[4] || "").trim(),
    };
  }
  return null;
}

const SYSTEM_PATTERNS = [
  /end-to-end encrypted/i,
  /messages and calls are/i,
  /you created group/i,
  /created this group/i,
  /changed the (subject|group description|icon)/i,
  /added you/i,
  /left/i,
  /removed/i,
  /joined using/i,
  /waiting for this message/i,
  /this message was deleted/i,
  /you deleted this message/i,
  /<media omitted>/i,
  /video omitted/i,
  /image omitted/i,
  /sticker omitted/i,
  /this message is from an unsaved number/i,
];

const CHATTER = new Set(
  [
    "ok",
    "okay",
    "k",
    "kk",
    "ok.",
    "ok!",
    "yes",
    "yeah",
    "yup",
    "no",
    "nah",
    "lol",
    "lmao",
    "haha",
    "hahaha",
    "hehe",
    "thanks",
    "thank you",
    "thx",
    "ty",
    "tysm",
    "noted",
    "done",
    "cool",
    "nice",
    "gm",
    "gn",
    "good morning",
    "good night",
    "haan",
    "ha",
    "hmm",
    "hmmm",
    "👍",
    "🙏",
    "👌",
    "🔥",
    "😂",
    "😅",
    "❤️",
    "👍🏻",
  ].map((s) => s.toLowerCase()),
);

export function normalizeChat(raw: string) {
  return raw
    .replace(/\u200e|\u200f|\ufeff/g, "")
    .replace(/\u202f/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function parseWhatsApp(raw: string): ChatMessage[] {
  const text = normalizeChat(raw);
  if (!text) return [];

  const lines = text.split("\n");
  const messages: ChatMessage[] = [];
  let current: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = matchHeader(trimmed);
    if (match) {
      if (current) messages.push(current);
      current = match;
    } else if (current) {
      current.text = `${current.text}\n${trimmed}`.trim();
    } else {
      current = { at: null, sender: "Unknown", text: trimmed };
    }
  }
  if (current) messages.push(current);
  return messages;
}

export function isSystemMessage(text: string) {
  return SYSTEM_PATTERNS.some((re) => re.test(text));
}

export function isChatter(text: string) {
  const cleaned = text.replace(/[^\p{L}\p{N}\p{Emoji}\s]/gu, "").trim().toLowerCase();
  if (!cleaned) return true;
  if (CHATTER.has(cleaned)) return true;
  if (cleaned.length <= 2) return true;
  return false;
}

export function likelyRequest(text: string) {
  if (isSystemMessage(text) || isChatter(text)) return false;
  const t = text.toLowerCase();
  const signals = [
    "please",
    "plz",
    "pls",
    "need",
    "can you",
    "could you",
    "move",
    "shift",
    "transfer",
    "room",
    "locker",
    "broken",
    "not working",
    "isn't",
    "isnt",
    "won't",
    "wont",
    "issue",
    "request",
    "charge",
    "extra",
    "id",
    "aadhaar",
    "aadhar",
    "kyc",
    "upload",
    "wifi",
    "wi-fi",
    "ac ",
    " a/c",
    "water",
    "leak",
    "guest",
    "check-in",
    "check in",
    "checkout",
    "check-out",
    "bill",
    "payment",
    "key",
    "lock",
    "linen",
    "housekeep",
    "housekeeping",
    "dirty",
    "fix",
    "repair",
    "complaint",
    "complaining",
    "stuck",
    "help",
    "add ",
  ];
  if (signals.some((s) => t.includes(s))) return true;
  return text.trim().length >= 28;
}

export function titleFromBody(text: string) {
  const line = text.split("\n")[0].replace(/\s+/g, " ").trim();
  if (line.length <= 88) return line;
  return `${line.slice(0, 85).trim()}…`;
}
