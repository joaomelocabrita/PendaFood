import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PendaFood",
  description: "A privacy-first food and symptom planning tool for people managing gut health.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
