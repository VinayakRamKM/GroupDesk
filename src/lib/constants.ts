export const BUILDER_NAME = "Vinayak Ram";

export const ATTRIBUTION = `Built by ${BUILDER_NAME} for the goSTOPS Build Sprint. Not an official goSTOPS product.`;

export const CATEGORIES = [
  { id: "room_move", label: "Room move", emoji: "🛏️" },
  { id: "locker", label: "Locker", emoji: "🔐" },
  { id: "id_kyc", label: "ID / KYC", emoji: "🪪" },
  { id: "extra_charge", label: "Extra charge", emoji: "₹" },
  { id: "maintenance", label: "Maintenance", emoji: "🛠️" },
  { id: "other", label: "Other", emoji: "📌" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const DESK_KINDS = [
  { id: "hostel", label: "Hostel / PG" },
  { id: "club", label: "College club" },
  { id: "office", label: "Office team" },
  { id: "family", label: "Family business" },
  { id: "other", label: "Other group" },
] as const;

export const SAMPLE_WHATSAPP = `[10:12, 24/11/2026] Ananya: hi can someone move the guest in 204 to 301? she wants a quieter room
[10:14, 24/11/2026] Rahul: ok
[10:15, 24/11/2026] Rahul: locker 12 not opening after last night, guest stuck with passport inside
[10:16, 24/11/2026] Meera: lol
[10:18, 24/11/2026] Front desk: ID of Mr Sharma (check-in tonight) still not uploaded. Please do KYC before 6
[10:19, 24/11/2026] Ananya: thanks
[10:22, 24/11/2026] Karan: add extra charge of 400 for laundry on bed 12B
[10:23, 24/11/2026] Rahul: wifi on 2nd floor dead since morning, 4 guests complaining
[10:24, 24/11/2026] Meera: 👍
[10:31, 24/11/2026] Night manager: AC in 108 making noise, guest asked to shift if not fixed by 8pm
[10:33, 24/11/2026] Ananya: also please tell housekeep to change linen in 210, guest checked in early`;
