import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pokdeng Calculator",
  icons: {
    icon: '/icon.png', 
  },
  description: "คำนวณโอกาสชนะ EV และคำแนะนำจั่วหรืออยู่ จากสำรับที่เหลืออยู่จริง",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
