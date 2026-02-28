import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteFooter } from "../components/SiteFooter";

export const metadata: Metadata = {
  title: "Styx | The Blockchain of Truth",
  description: "A decentralized, peer-audited behavioral market.",
};

const ENV_LABEL = process.env.NEXT_PUBLIC_STYX_ENV_LABEL || process.env.NODE_ENV || 'local';
const PRIVATE_BETA = String(process.env.NEXT_PUBLIC_STYX_PRIVATE_BETA || 'true').toLowerCase() === 'true';
const TEST_MONEY = String(process.env.NEXT_PUBLIC_STYX_TEST_MONEY_MODE || 'true').toLowerCase() === 'true';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {PRIVATE_BETA ? (
          <div className="w-full border-b border-amber-700/40 bg-amber-950/80 px-4 py-2 text-xs text-amber-200">
            <span className="font-semibold uppercase tracking-wide">Private Beta</span>
            <span className="mx-2 text-amber-400/80">•</span>
            <span>{TEST_MONEY ? 'Test-money pilot' : 'Pilot environment'}</span>
            <span className="mx-2 text-amber-400/80">•</span>
            <span className="uppercase tracking-wide">{ENV_LABEL}</span>
          </div>
        ) : null}
        <Providers><main className="flex-1">{children}</main></Providers>
        <SiteFooter />
      </body>
    </html>
  );
}
