import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPL Friends League 2026",
  description: "Sports dashboard tracking IPL Friends League standings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
