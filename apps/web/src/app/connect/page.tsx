"use client";

import Link from "next/link";
import { useWallet } from "@/lib/wallet-context";
import { LACE_WALLET_URL } from "@/lib/wallet-links";

export default function ConnectPage() {
  const { status, connecting, error, walletAvailable, connect } = useWallet();

  return (
    <main className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-14 overflow-hidden px-5 py-16 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:py-24">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[rgba(199,255,94,.05)] blur-3xl" />
      <section className="relative fade-up">
        <div className="eyebrow">Secure connection</div>
        <h1 className="display-title mt-7 max-w-xl text-5xl sm:text-7xl">
          Your wallet.<br /><span className="gradient-text">Your control.</span>
        </h1>
        <p className="mt-6 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
          Connect through Midnight&apos;s standard DApp Connector. Nivra never receives your spending keys, credentials, or private invoice data.
        </p>
        <div className="mt-9 flex flex-wrap gap-6 text-xs text-[var(--text-muted)]">
          <Feature icon={<KeyIcon />} label="Keys stay local" />
          <Feature icon={<NoServerIcon />} label="No Nivra server" />
        </div>
      </section>

      <section className="shine-border fade-up relative rounded-[1.75rem] bg-[#111518] p-2 shadow-[0_40px_100px_rgba(0,0,0,.35)]" style={{ animationDelay: "100ms" }}>
        <div className="rounded-[1.35rem] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 sm:p-9">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-ink)]"><WalletIcon /></div>
            <div>
              <p className="text-sm font-semibold">Midnight wallet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">DApp Connector · CAIP-372</p>
            </div>
            <span className="ml-auto h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_14px_var(--accent)]" />
          </div>

          <div className="my-8 h-px bg-[var(--border)]" />

          {status === "connected" ? (
            <div>
              <div className="rounded-2xl border border-[rgba(129,230,173,.2)] bg-[var(--success-bg)] p-4 text-sm text-[var(--success)]">
                <span className="flex items-center gap-2 font-semibold"><CheckIcon /> Wallet connected securely</span>
              </div>
              <Link href="/dashboard" className="btn-primary mt-4 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                Continue to dashboard <ArrowIcon />
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <Permission title="View your public wallet address" description="Used to identify your merchant account." />
                <Permission title="Request transaction signatures" description="You review and approve every action in your wallet." />
              </div>
              {walletAvailable === false ? (
                <a href={LACE_WALLET_URL} target="_blank" rel="noreferrer" className="btn-primary mt-8 w-full rounded-full px-6 py-3.5 text-sm font-semibold">
                  Install Lace for Midnight <ArrowIcon />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => void connect()}
                  disabled={connecting}
                  className="btn-primary mt-8 w-full rounded-full px-6 py-3.5 text-sm font-semibold disabled:cursor-not-allowed"
                >
                  {connecting ? "Looking for your wallet…" : "Connect Midnight wallet"}
                  {!connecting && <ArrowIcon />}
                </button>
              )}
              {status === "error" && error && (
                <p className="mt-4 rounded-xl bg-[var(--warning-bg)] px-4 py-3 text-xs leading-5 text-[var(--warning)]">{error}</p>
              )}
            </>
          )}
          <p className="mt-5 text-center text-[11px] leading-5 text-[var(--text-muted)]">
            {walletAvailable === false ? "Lace was not detected in this browser. Install it, unlock it, then reload." : "Nivra checks for a compatible DApp Connector locally in your browser."}
          </p>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="flex items-center gap-2.5"><span className="text-[var(--accent)]">{icon}</span>{label}</span>;
}
function Permission({ title, description }: { title: string; description: string }) {
  return <div className="flex gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[rgba(199,255,94,.1)] text-[var(--accent)]"><CheckIcon /></span><div><p className="text-xs font-medium text-[var(--text-primary)]">{title}</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">{description}</p></div></div>;
}
function WalletIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6.5h14a2 2 0 0 1 2 2V18H6a2 2 0 0 1-2-2V6.5Zm0 0A2.5 2.5 0 0 1 6.5 4H17v2.5M16 11h4v4h-4a2 2 0 0 1 0-4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>; }
function KeyIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="5.5" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8.5 8H14M12 8v2M10 8v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function NoServerIcon() { return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="2.5" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="3" y="9.5" width="10" height="4" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M5.5 4.5h.01M5.5 11.5h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>; }
function CheckIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3L13 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ArrowIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
