import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { ATTRIBUTION } from "@/lib/constants";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
});

const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "GroupDesk — bury less, close more",
  description:
    "Turn messy WhatsApp group chats into tasks that get tracked and closed.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GroupDesk",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <footer className="mt-auto border-t border-line px-5 py-6 text-center text-xs text-muted">
          {ATTRIBUTION}
        </footer>
      </body>
    </html>
  );
}
