"use client";

import { useEffect } from "react";

export type WalletChoice = {
  readonly rdns: string;
  readonly name: string;
  readonly apiVersion: string;
};

type WalletPickerProps = {
  readonly open: boolean;
  readonly wallets: readonly WalletChoice[];
  readonly connecting: boolean;
  readonly onChoose: (rdns: string) => void;
  readonly onClose: () => void;
};

const walletBrand = (wallet: WalletChoice) => {
  const identity = `${wallet.name} ${wallet.rdns}`.toLowerCase();
  if (identity.includes("1am")) return { name: "1AM Wallet", mark: "1A", tone: "from-[#8f5cff] to-[#d16cff]" };
  if (identity.includes("lace")) return { name: "Lace Wallet", mark: "L", tone: "from-[#725cff] to-[#ff5cb8]" };
  return { name: wallet.name, mark: wallet.name.slice(0, 2).toUpperCase(), tone: "from-[#c7ff5e] to-[#7ae7db]" };
};

export function WalletPicker({ open, wallets, connecting, onChoose, onClose }: WalletPickerProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !connecting) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, connecting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(1,4,6,.78)] px-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target && !connecting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
        className="shine-border relative w-full max-w-md overflow-hidden rounded-[1.75rem] bg-[#101416] p-[1px] shadow-[0_32px_100px_rgba(0,0,0,.65)]"
      >
        <div className="relative rounded-[calc(1.75rem-1px)] border border-[var(--border)] bg-[linear-gradient(145deg,#151a1c,#0d1113)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-[rgba(199,255,94,.1)] blur-3xl" />
          <button
            type="button"
            onClick={onClose}
            disabled={connecting}
            aria-label="Close wallet selection"
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-lg text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            ×
          </button>

          <div className="relative pr-10">
            <div className="eyebrow">Secure connection</div>
            <h2 id="wallet-picker-title" className="mt-4 text-2xl font-semibold tracking-[-.04em] text-[var(--text-primary)]">Choose your wallet</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Select the Midnight wallet you want Nivra to connect with.</p>
          </div>

          <div className="relative mt-6 space-y-3">
            {wallets.map((wallet) => {
              const brand = walletBrand(wallet);
              return (
                <button
                  key={`${wallet.rdns}:${wallet.apiVersion}`}
                  type="button"
                  onClick={() => onChoose(wallet.rdns)}
                  disabled={connecting}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,.025)] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[rgba(199,255,94,.42)] hover:bg-[rgba(199,255,94,.055)] disabled:cursor-wait disabled:opacity-55"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${brand.tone} text-sm font-black text-[#07100d] shadow-lg`}>
                    {brand.mark}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{brand.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-[var(--text-muted)]">Detected · Connector v{wallet.apiVersion}</span>
                  </span>
                  <span className="text-lg text-[var(--accent)] transition-transform group-hover:translate-x-1">→</span>
                </button>
              );
            })}
          </div>

          {wallets.length === 0 && (
            <div className="relative mt-6 rounded-2xl border border-[rgba(245,203,118,.2)] bg-[var(--warning-bg)] p-4 text-sm leading-6 text-[var(--warning)]">
              No compatible Midnight wallet is currently detected. Unlock Lace or 1AM, then reopen this selector.
            </div>
          )}

          <div className="relative mt-5 flex items-center gap-2 text-[11px] leading-5 text-[var(--text-muted)]">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(129,230,173,.1)] text-[var(--success)]">✓</span>
            Nivra only connects to the wallet you select.
          </div>
        </div>
      </section>
    </div>
  );
}
