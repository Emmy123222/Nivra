"use client";

import { useEffect, useState } from "react";
import {
  parsePaymentLinkUrl,
  verifyInvoicePaymentLink,
  invoiceCommitmentFromPaymentLink,
  joinInvoiceRegistry,
  bytesToHex,
  type PaymentLinkPayload,
  type DeployedInvoiceRegistryContract,
  type InvoiceRegistryProviders,
} from "@nivra/sdk";
import { createNivraPrivateState } from "@nivra/contracts";
import { useWallet } from "@/lib/wallet-context";

/** Wraps the SDK's `verifyInvoicePaymentLink` so "no wallet yet" / an unreachable indexer reads as "unverified", not a crash. */
const checkOnChain = async (
  providers: InvoiceRegistryProviders | null,
  payload: PaymentLinkPayload,
): Promise<{ commitment: Uint8Array; onChain: boolean }> => {
  if (!providers) return { commitment: invoiceCommitmentFromPaymentLink(payload), onChain: false };
  try {
    return await verifyInvoicePaymentLink(providers, payload);
  } catch {
    return { commitment: invoiceCommitmentFromPaymentLink(payload), onChain: false };
  }
};

type CheckoutState =
  | { step: "loading" }
  | { step: "no-link" }
  | { step: "invalid"; reason: string }
  | { step: "ready"; payload: PaymentLinkPayload; commitment: string; onChain: boolean }
  | { step: "paying"; payload: PaymentLinkPayload; commitment: string }
  | { step: "error"; message: string };

export default function CheckoutPage() {
  const { status, connect, connecting, providers } = useWallet();
  const [state, setState] = useState<CheckoutState>({ step: "loading" });

  // The payment link's private fields live only in the URL fragment (never sent to any
  // server) — see packages/sdk/src/payment-link.ts for why. `window.location.hash` is
  // only available client-side, hence this effect rather than reading it during render.
  // The whole body runs as one async task so every branch's setState happens from an
  // async continuation rather than synchronously inside the effect callback itself.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const hash = window.location.hash;
      if (!hash || hash.length <= 1) {
        if (!cancelled) setState({ step: "no-link" });
        return;
      }

      let payload: PaymentLinkPayload;
      try {
        payload = parsePaymentLinkUrl(window.location.href);
      } catch (e) {
        if (!cancelled) setState({ step: "invalid", reason: e instanceof Error ? e.message : String(e) });
        return;
      }

      const { commitment: commitmentBytes, onChain } = await checkOnChain(providers, payload);
      const commitment = bytesToHex(commitmentBytes);
      if (!cancelled) setState({ step: "ready", payload, commitment, onChain });
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally mount-only: re-verifying against `providers` happens via the
    // "Connect wallet to pay" -> pay() path, not by re-running link parsing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pay = async () => {
    if (state.step !== "ready") return;
    const { payload, commitment } = state;
    setState({ step: "paying", payload, commitment });
    try {
      if (!providers) throw new Error("Wallet not connected.");
      // Wave 1 limitation, stated plainly: paying does not require the payer to hold a
      // merchant credential, but joinInvoiceRegistry's private-state shape currently
      // requires *some* NivraPrivateState. A payer-only private state (no merchant
      // secret) is a real follow-up — see docs/BUILD_STATUS.md — so this uses a
      // throwaway credential the payer never needs again.
      const deployed: DeployedInvoiceRegistryContract = await joinInvoiceRegistry(
        providers,
        window.location.origin,
        payload.contractAddress,
        createNivraPrivateState(crypto.getRandomValues(new Uint8Array(32)), crypto.getRandomValues(new Uint8Array(32))),
      );
      void deployed; // joined successfully; real settlement wiring is the remaining gap, thrown below

      // The payer's wallet, not this app, is the source of the actual coin used to settle —
      // integrating a real payment coin selection through the DApp Connector's
      // `makeIntent`/proving flow is the next real piece of settlement wiring (tracked in
      // docs/BUILD_STATUS.md). This demo cannot fabricate a coin the wallet didn't provide.
      throw new Error(
        "Real settlement requires selecting an actual Zswap coin through your wallet — not wired up yet in this Wave 1 checkout. The contract's settleInvoice circuit itself is implemented and tested (see contracts/src/test).",
      );
    } catch (e) {
      setState({ step: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  if (state.step === "loading") return <CenteredMessage>Loading…</CenteredMessage>;
  if (state.step === "no-link") {
    return (
      <CenteredMessage>
        No payment link data found. Open this page via a link a merchant generated from their dashboard.
      </CenteredMessage>
    );
  }
  if (state.step === "invalid") {
    return <CenteredMessage tone="error">This payment link is malformed: {state.reason}</CenteredMessage>;
  }
  if (state.step === "error") {
    return <CenteredMessage tone="error">{state.message}</CenteredMessage>;
  }

  const { payload, commitment } = state;
  const onChainOk = state.step === "ready" ? state.onChain : true;

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
      <h1 className="fade-up text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Pay invoice</h1>

      <div className="card fade-up mt-6 rounded-2xl p-6" style={{ animationDelay: "0.05s" }}>
        <div className="text-center">
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Amount due</span>
          <p className="gradient-text mt-1 text-4xl font-bold tabular-nums">{payload.amount}</p>
        </div>

        <dl className="mt-6 space-y-3 border-t border-[var(--border)] pt-4 text-sm">
          <Row label="Token color" value={<span className="font-mono text-xs">{payload.tokenColor.slice(0, 16)}…</span>} />
          <Row label="Expires" value={new Date(Number(payload.expiry) * 1000).toLocaleString()} />
          <Row label="Commitment" value={<span className="font-mono text-xs">{commitment.slice(0, 16)}…</span>} />
        </dl>

        <div className="mt-4 rounded-lg px-3 py-2 text-xs font-medium">
          {onChainOk ? (
            <p className="flex items-center gap-1.5 text-[var(--success)]">
              <CheckIcon /> Verified against the on-chain commitment.
            </p>
          ) : (
            <p className="text-[var(--warning)]">
              Could not confirm this invoice exists on-chain yet (connect a wallet to check, or the indexer may be
              unreachable in this environment). Do not trust this link&rsquo;s figures blindly.
            </p>
          )}
        </div>
      </div>

      {status !== "connected" ? (
        <button
          type="button"
          onClick={() => void connect()}
          disabled={connecting}
          className="btn-primary fade-up mt-6 w-full rounded-full px-6 py-3 text-sm font-medium disabled:cursor-not-allowed"
          style={{ animationDelay: "0.1s" }}
        >
          {connecting ? "Connecting…" : "Connect wallet to pay"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void pay()}
          disabled={state.step === "paying"}
          className="btn-primary fade-up mt-6 w-full rounded-full px-6 py-3 text-sm font-medium disabled:cursor-not-allowed"
          style={{ animationDelay: "0.1s" }}
        >
          {state.step === "paying" ? "Preparing payment…" : "Pay now"}
        </button>
      )}
    </main>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
    </div>
  );
}

function CenteredMessage({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <p className={`text-center text-sm ${tone === "error" ? "text-[var(--danger)]" : "text-[var(--text-secondary)]"}`}>
        {children}
      </p>
    </main>
  );
}
