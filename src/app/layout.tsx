import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Context OS",
  description:
    "A product-memory workspace for source-backed Context Packs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
