import type { Metadata } from "next";

import { PRODUCT_NAME } from "@/config/product";

import "./globals.css";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
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
