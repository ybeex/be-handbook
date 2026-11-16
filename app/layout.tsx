import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Backend Engineering Handbook",
  description: "A premium interactive handbook for learning backend engineering from zero to production.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ backgroundColor: '#0A0A0F', color: '#F0F0F8' }}>
        {children}
      </body>
    </html>
  );
}
