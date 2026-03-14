import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InsightAI - Executive BI Dashboard",
  description: "AI-powered natural language data analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}