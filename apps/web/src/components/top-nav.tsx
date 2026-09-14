"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet-context";
import { LogoMark } from "@/components/logo";
import { LACE_WALLET_URL } from "@/lib/wallet-links";

export function TopNav() {
  const pathname = usePathname();
  const { status, connecting, error, walletAvailable, connect, dismissError } = useWallet();

  return (
    <header className="glass sticky top-0 z-50 border-x-0 border-t-0">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Nivra home">
          <span className="transition-transform duration-300 group-hover:-rotate-6"><LogoMark size={30} /></span>
          <span className="text-[17px] font-semibold tracking-[-0.035em] text-[var(--text-primary)]">nivra</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] font-medium sm:flex" aria-label="Primary navigation">
          <Link href="/#how-it-works" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">How it works</Link>
          <Link href="/#privacy" className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">Privacy</Link>
          <Link
            href="/dashboard"
            className={pathname.startsWith("/dashboard") ? "text-[var(--accent)]" : "text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"}
          >
            Dashboard
          </Link>
        </nav>

        {status === "connected" ? (
          <Link href="/dashboard" className="btn-ghost rounded-full px-4 py-2 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] shadow-[0_0_10px_var(--success)]" />
            Wallet connected
          </Link>
        ) : walletAvailable === false ? (
          <a href={LACE_WALLET_URL} target="_blank" rel="noreferrer" className="btn-primary rounded-full px-4 py-2 text-xs font-semibold sm:px-5">
            Get Lace wallet <ArrowIcon />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={connecting}
            className="btn-primary rounded-full px-4 py-2 text-xs font-semibold disabled:cursor-not-allowed sm:px-5"
          >
            {connecting ? "Connecting…" : "Connect wallet"}
            {!connecting && <ArrowIcon />}
          </button>
        )}
      </div>
      {status === "error" && error && (
        <div role="alert" className="absolute right-5 top-[82px] z-50 w-[min(390px,calc(100vw-2.5rem))] rounded-2xl border border-[rgba(245,203,118,.22)] bg-[#171713] p-4 shadow-2xl sm:right-8">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--warning-bg)] text-[var(--warning)]">!</span>
            <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[var(--text-primary)]">Wallet extension not detected</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">Install Lace for Midnight, unlock it, then reload this page.</p><a href={LACE_WALLET_URL} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-[11px] font-semibold text-[var(--accent)] hover:underline">Open wallet download ↗</a></div>
            <button type="button" onClick={dismissError} aria-label="Dismiss wallet message" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">×</button>
          </div>
        </div>
      )}
    </header>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
