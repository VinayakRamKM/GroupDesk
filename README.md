# GroupDesk

Turn a messy WhatsApp group into tasks that get tracked and closed.

Built by Vinayak Ram for the goSTOPS Build Sprint. Not an official goSTOPS product.

## Why this shape

Hostel and ops groups fail because requests and chatter share one timeline. GroupDesk is the system of record: paste or share a chat, drop the noise, put a name on the work, close it.

WhatsApp Cloud API will not land in a 72-hour student sprint. The product meets the group where it already is (paste, share, a link in the chat). Judging is closed-request volume, so capture and close are one or two taps.

## Run locally

```bash
npm install
npx drizzle-kit push
npm run dev
```

Needs `DATABASE_URL` from Neon (already in `.env.local` when the project is linked).

## How to get real volume by Friday

1. Create a desk at `/new`.
2. Paste the invite into a college club, PG, family shop, or intern WhatsApp.
3. Export a slice of yesterday’s chat (WhatsApp → More → Export chat → without media) and paste it.
4. Close work as it happens. The scoreboard is `/proof`.
5. Record a 3-minute Loom of paste → tasks → close → WhatsApp ping.

Half-page writeup (copy from `/note` or the section above) plus live numbers from `/proof`.
