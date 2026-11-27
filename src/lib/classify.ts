import type { CategoryId } from "./constants";

export type ExtractedItem = {
  title: string;
  body: string;
  category: CategoryId;
  priority: "low" | "normal" | "high";
  requesterName: string;
  sourceMessage: string;
  keep: boolean;
};

const CATEGORY_RULES: { id: CategoryId; words: string[] }[] = [
  {
    id: "room_move",
    words: ["move", "shift", "transfer", "another room", "change room", "quieter"],
  },
  {
    id: "locker",
    words: ["locker", "locker's", "cupboard", "passport inside"],
  },
  {
    id: "id_kyc",
    words: ["kyc", "aadhaar", "aadhar", "id card", "id isn't", "id isnt", "id not", "upload", "document"],
  },
  {
    id: "extra_charge",
    words: ["extra charge", "add charge", "laundry", "bill", "payment", "₹", "rs ", "inr"],
  },
  {
    id: "maintenance",
    words: [
      "wifi",
      "wi-fi",
      "ac ",
      "a/c",
      "water",
      "leak",
      "broken",
      "not working",
      "repair",
      "fix",
      "noise",
      "linen",
      "housekeep",
      "light",
      "fan",
      "geyser",
    ],
  },
];

export function classifyCategory(text: string): CategoryId {
  const t = ` ${text.toLowerCase()} `;
  for (const rule of CATEGORY_RULES) {
    if (rule.words.some((w) => t.includes(w))) return rule.id;
  }
  if (/\bid\b/i.test(text)) return "id_kyc";
  if (/\broom\b/i.test(text)) return "room_move";
  return "other";
}

export function classifyPriority(text: string): "low" | "normal" | "high" {
  const t = text.toLowerCase();
  if (
    /urgent|asap|immediately|stuck|not opening|dead since|tonight|before \d/.test(
      t,
    )
  ) {
    return "high";
  }
  return "normal";
}
