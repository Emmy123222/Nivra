"use client";

import { useEffect, useState } from "react";
import { parseReceiptLinkUrl, verifyReceiptLink, type ReceiptLinkPayload } from "@nivra/sdk";
import { useWallet } from "@/lib/wallet-context";

type ReceiptState =
  | { step: "loading" }
  | { step: "no-link" }
  | { step: "invalid"; reason: string }
  | { step: "checking"; payload: ReceiptLinkPayload }
  | { step: "verified"; payload: ReceiptLinkPayload }
  | { step: "not-found"; payload: ReceiptLinkPayload }
  | { step: "error"; message: string };

export default function ReceiptPage() {
  const { providers } = useWallet();
  const [state, setState] = useState<ReceiptState>({ step: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const hash = window.location.hash;
      if (!hash || hash.length <= 1) {
        if (!cancelled) setState({ step: "no-link" });
        return;
      }

      let payload: ReceiptLinkPayload;
      try {
        payload = parseReceiptLinkUrl(window.location.href);
      } catch (e) {
        if (!cancelled) setState({ step: "invalid", reason: e instanceof Error ? e.message : String(e) });
        return;
      }

      if (!cancelled) setState({ step: "checking", payload });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.step !== "checking" || !providers) return;
    let cancelled = false;
    void verifyReceiptLink(providers, state.payload)
      .then((ok) => {
        if (cancelled) return;
        setState(ok ? { step: "verified", payload: state.payload } : { step: "not-found", payload: state.payload });
      })
      .catch((e) => {
        if (!cancelled) setState({ step: "error", message: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [state, providers]);

  if (state.step === "loading") return <Centered>Loading…</Centered>;
  if (state.step === "no-link") {
    return <Centered>No receipt link data found. Open this page via a receipt link from a checkout confirmation.</Centered>;
  }
  if (state.step === "invalid") return <Centered tone="error">This receipt link is malformed: {state.reason}</Centered>;
  if (state.step === "error") return <Centered tone="error">{state.message}</Centered>;

  if (state.step === "checking") {
    return (
      <Centered>
        {providers ? "Checking against the chain…" : "Connect a wallet to verify this receipt against the chain."}
      </Centered>
    );
  }

  const verified = state.step === "verified";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
      <div className="card fade-up rounded-2xl p-8 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: verified ? "var(--success-bg)" : "var(--danger-bg)",
            color: verified ? "var(--success)" : "var(--danger)",
          }}
        >
          {verified ? <BigCheckIcon /> : <BigCrossIcon />}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          {verified ? "Receipt verified" : "Receipt not found"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          {verified
            ? "This receipt corresponds to a real, successfully settled invoice on-chain — without revealing the invoice's amount or contents to anyone viewing this page."
            : "No settlement matching this receipt secret was found for this invoice. It may be unpaid, or the link may be invalid."}
        </p>
        <p className="mt-4 break-all rounded-lg bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-muted)]">
          {state.payload.invoiceCommitment.slice(0, 24)}…
        </p>
      </div>
    </main>
  );
}

function BigCheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BigCrossIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function Centered({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <p className={`text-center text-sm ${tone === "error" ? "text-[var(--danger)]" : "text-[var(--text-secondary)]"}`}>
        {children}
      </p>
    </main>
  );
}
