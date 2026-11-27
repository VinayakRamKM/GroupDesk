import { classifyCategory, classifyPriority, type ExtractedItem } from "./classify";
import {
  isChatter,
  isSystemMessage,
  likelyRequest,
  parseWhatsApp,
  titleFromBody,
} from "./whatsapp";

export function extractFromChat(raw: string): ExtractedItem[] {
  const messages = parseWhatsApp(raw);
  if (messages.length === 0) {
    const body = raw.trim();
    if (!body) return [];
    return [
      {
        title: titleFromBody(body),
        body,
        category: classifyCategory(body),
        priority: classifyPriority(body),
        requesterName: "Pasted",
        sourceMessage: body,
        keep: likelyRequest(body),
      },
    ];
  }

  const items: ExtractedItem[] = [];
  for (const msg of messages) {
    if (isSystemMessage(msg.text) || isChatter(msg.text)) continue;
    const keep = likelyRequest(msg.text);
    if (!keep && msg.text.trim().length < 18) continue;
    items.push({
      title: titleFromBody(msg.text),
      body: msg.text,
      category: classifyCategory(msg.text),
      priority: classifyPriority(msg.text),
      requesterName: msg.sender || "Unknown",
      sourceMessage: msg.at ? `[${msg.at}] ${msg.sender}: ${msg.text}` : msg.text,
      keep,
    });
  }
  return items;
}
