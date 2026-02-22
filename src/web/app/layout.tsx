import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Styx | The Blockchain of Truth",
  description: "A decentralized, peer-audited behavioral market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
