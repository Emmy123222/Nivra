import type { Metadata } from "next";
import "./globals.css";
import { WalletContextProvider } from "@/lib/wallet-context";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Nivra — private invoicing on Midnight",
  description: "Privacy-first invoicing and payment settlement, built natively on the Midnight Network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <WalletContextProvider>
          <TopNav />
          <div className="flex flex-1 flex-col">{children}</div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
