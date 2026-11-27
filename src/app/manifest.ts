import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GroupDesk",
    short_name: "GroupDesk",
    description: "Turn WhatsApp group chats into closeable tasks.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ead8",
    theme_color: "#c24b1c",
    share_target: {
      action: "/share/receive",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
