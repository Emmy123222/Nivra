"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { InvoiceRegistry } from "@nivra/contracts";
import {
  buildPaymentLinkUrl,
  buildPaymentLinkPayload,
  computeMerchantCommitment,
  hexToBytes,
} from "@nivra/sdk";
import { useWallet } from "@/lib/wallet-context";
import {
  getOrCreateMerchantCredential,
  getStoredContractAddress,
  getStoredInvoice,
  type StoredInvoice,
} from "@/lib/invoice-store";
import { StatusBadge } from "@/components/status-badge";

export function InvoiceDetailsClient({ commitment }: { commitment: string }) {
  const { status, contract, getLedger } = useWallet();
  // `localStorage` isn't available during server rendering, so this starts `undefined`
  // (meaning "not checked yet") on both the server and the initial client render, then
  // resolves client-side — avoiding a hydration mismatch from reading it during render.
  const [invoice, setInvoice] = useState<StoredInvoice | null | undefined>(undefined);
  const [isExpired, setIsExpired] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) {
        const stored = getStoredInvoice(commitment) ?? null;
        setInvoice(stored);
        setIsExpired(stored ? Date.now() / 1000 >= Number(stored.expiry) : false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [commitment]);
  const [state, setState] = useState<InvoiceRegistry.InvoiceState | null>(null);
  const [receiptRegistered, setReceiptRegistered] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!invoice) return;
    const ledger = await getLedger();
    const commitmentBytes = hexToBytes(commitment);
    if (ledger?.invoices.member(commitmentBytes)) {
      const record = ledger.invoices.lookup(commitmentBytes);
      setState(record.state);
      setReceiptRegistered(ledger.receipts.member(commitmentBytes));
    }
  }, [invoice, getLedger, commitment]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Pure derivation from stored, synchronously-available data — a memo, not an effect.
  const paymentUrl = useMemo(() => {
    if (!invoice) return null;
    const contractAddress = getStoredContractAddress();
    if (!contractAddress) return null;
    const { merchantSecret, merchantNonce } = getOrCreateMerchantCredential();
    const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
    if (!invoice.merchantPayoutKey || !invoice.merchantEncryptionPublicKey) return null;
    const payload = buildPaymentLinkPayload(contractAddress, merchantCommitment, {
      amount: BigInt(invoice.amount),
      tokenColor: hexToBytes(invoice.tokenColor),
      expiry: BigInt(invoice.expiry),
      metadataHash: hexToBytes(invoice.metadataHash),
      invoiceSecret: hexToBytes(invoice.invoiceSecret),
      nonce: hexToBytes(invoice.nonce),
    }, invoice.merchantPayoutKey, invoice.merchantEncryptionPublicKey);
    return buildPaymentLinkUrl(`${window.location.origin}/checkout`, payload);
  }, [invoice]);

  // The QR image itself is genuinely async (canvas rendering), so this stays an effect.
  useEffect(() => {
    if (!paymentUrl) return;
    let cancelled = false;
    void QRCode.toDataURL(paymentUrl, { margin: 1, width: 240 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [paymentUrl]);

  const cancel = async () => {
    if (!contract || !invoice) return;
    setBusy(true);
    setActionError(null);
    try {
      await contract.callTx.cancelInvoice(
        BigInt(invoice.amount),
        hexToBytes(invoice.tokenColor),
        BigInt(invoice.expiry),
        hexToBytes(invoice.metadataHash),
        hexToBytes(invoice.invoiceSecret),
        hexToBytes(invoice.nonce),
      );
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const markExpired = async () => {
    if (!contract || !invoice) return;
    setBusy(true);
    setActionError(null);
    try {
      const { merchantSecret, merchantNonce } = getOrCreateMerchantCredential();
      const merchantCommitment = computeMerchantCommitment(merchantSecret, merchantNonce);
      await contract.callTx.markExpired(
        BigInt(invoice.amount),
        merchantCommitment,
        hexToBytes(invoice.tokenColor),
        BigInt(invoice.expiry),
        hexToBytes(invoice.metadataHash),
        hexToBytes(invoice.invoiceSecret),
        hexToBytes(invoice.nonce),
      );
      await refresh();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (invoice === undefined) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      </main>
    );
  }

  if (invoice === null) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-sm text-[var(--text-secondary)]">
          No invoice with commitment{" "}
          <code className="rounded bg-[var(--surface)] px-1 py-0.5 font-mono text-xs">{commitment}</code> found in
          this browser.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
      <div className="fade-up flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          {invoice.label || "Invoice"}
        </h1>
        {state !== null && <StatusBadge state={state} />}
      </div>

      <dl className="card fade-up mt-6 grid grid-cols-2 gap-5 rounded-2xl p-6 text-sm" style={{ animationDelay: "0.05s" }}>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Amount</dt>
          <dd className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{invoice.amount}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Expiry</dt>
          <dd className="mt-1 font-medium text-[var(--text-primary)]">
            {new Date(Number(invoice.expiry) * 1000).toLocaleString()}
          </dd>
        </div>
        <div className="col-span-2 border-t border-[var(--border)] pt-4">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Commitment (public)</dt>
          <dd className="mt-1 break-all font-mono text-xs text-[var(--text-secondary)]">{invoice.commitment}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Receipt registered on-chain</dt>
          <dd className="mt-1 font-medium text-[var(--text-primary)]">{receiptRegistered ? "Yes" : "Not yet"}</dd>
        </div>
      </dl>

      {status === "connected" && state === InvoiceRegistry.InvoiceState.ACTIVE && (
        <div className="fade-up mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={busy}
            className="rounded-full border border-[var(--danger)]/40 bg-[var(--danger-bg)] px-5 py-2 text-sm font-medium text-[var(--danger)] transition-colors hover:bg-[var(--danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel invoice"}
          </button>
          {isExpired && (
            <button type="button" onClick={() => void markExpired()} disabled={busy} className="btn-ghost rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50">
              {busy ? "Updating…" : "Mark expired"}
            </button>
          )}
        </div>
      )}
      {actionError && (
        <p className="mt-3 rounded-lg bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">{actionError}</p>
      )}

      {state === InvoiceRegistry.InvoiceState.PAID && (
        <p className="fade-up mt-4 rounded-lg bg-[var(--success-bg)] px-4 py-3 text-sm text-[var(--success)]">
          Paid and routed to your shielded wallet atomically. No separate withdrawal or claim is required.
        </p>
      )}

      {!invoice.merchantPayoutKey && (
        <p className="mt-4 rounded-lg bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning)]">
          This invoice predates atomic payout links. Create a new invoice to generate a payable link.
        </p>
      )}

      {paymentUrl && (
        <div className="card fade-up mt-8 rounded-2xl p-6" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">Payment link</h2>
          <p className="mt-2 break-all rounded-lg bg-[var(--bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
            {paymentUrl}
          </p>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(paymentUrl).then(() => setCopied(true))}
            className="btn-primary mt-4 rounded-full px-5 py-2 text-xs font-semibold"
          >
            {copied ? "Copied" : "Copy payment link"}
          </button>
          {qrDataUrl && (
            <div className="mt-4 inline-block rounded-xl bg-white p-3">
              <Image src={qrDataUrl} alt="Payment link QR code" width={180} height={180} unoptimized />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
