"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { bytesToHex } from "@nivra/sdk";
import { useWallet } from "@/lib/wallet-context";
import { addStoredInvoice } from "@/lib/invoice-store";

const randomHex32 = () => bytesToHex(crypto.getRandomValues(new Uint8Array(32)));

// Assumed convention, not yet verified against a live network (no Docker/proof
// server available in this sandbox — see docs/TOOLCHAIN.md): `expiry` is
// seconds since the Unix epoch, matching block-timestamp conventions used by
// most chains. Confirm against Preprod's actual clock before relying on this
// for a real deployment.
const nowPlusDays = (days: number) => BigInt(Math.floor(Date.now() / 1000) + days * 86_400);

export default function CreateInvoicePage() {
  const router = useRouter();
  const { status, contract, ensureContract } = useWallet();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenColor, setTokenColor] = useState(() => randomHex32());
  const [days, setDays] = useState("7");
  const [metadataNote, setMetadataNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Enter a positive amount.");
      return;
    }
    setSubmitting(true);
    try {
      const deployed = contract ?? (await ensureContract());

      const invoice = {
        amount: BigInt(amount),
        tokenColor: hexToBytes(tokenColor),
        expiry: nowPlusDays(Number(days)),
        // The metadata note lives only in this browser (see invoice-store.ts) — only its
        // hash goes on-chain, per docs/PRIVACY_MODEL.md.
        metadataHash: await sha256(metadataNote || label || "nivra-invoice"),
        invoiceSecret: crypto.getRandomValues(new Uint8Array(32)),
        nonce: crypto.getRandomValues(new Uint8Array(32)),
      };

      const finalizedTx = await deployed.callTx.createInvoice(
        invoice.amount,
        invoice.tokenColor,
        invoice.expiry,
        invoice.metadataHash,
        invoice.invoiceSecret,
        invoice.nonce,
      );
      // `createInvoice`'s JS-typed return value (the raw commitment) lives under
      // `.private.result` — CallResult's privacy-sensitive `private` field, not `.public`.
      const commitmentHex = bytesToHex(finalizedTx.private.result);

      addStoredInvoice({
        commitment: commitmentHex,
        amount: invoice.amount.toString(),
        tokenColor,
        expiry: invoice.expiry.toString(),
        metadataHash: bytesToHex(invoice.metadataHash),
        invoiceSecret: bytesToHex(invoice.invoiceSecret),
        nonce: bytesToHex(invoice.nonce),
        label: label || undefined,
        createdAt: Date.now(),
      });

      router.push(`/dashboard/invoices/${commitmentHex}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== "connected") {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Connect a wallet from the dashboard before creating an invoice.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-12 sm:px-6">
      <h1 className="fade-up text-2xl font-semibold tracking-tight text-[var(--text-primary)]">Create invoice</h1>
      <p className="fade-up mt-1 text-sm text-[var(--text-secondary)]" style={{ animationDelay: "0.05s" }}>
        Only the commitment below goes on-chain. Amount, notes, and the token color stay private,
        carried later in the payment link.
      </p>

      <form
        onSubmit={submit}
        className="card fade-up mt-6 space-y-5 rounded-2xl p-6"
        style={{ animationDelay: "0.1s" }}
      >
        <Field label="Label (private, this browser only)">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Invoice #1042 — logo design"
            className="input-field w-full rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Amount">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="250000"
            className="input-field w-full rounded-lg px-3 py-2 text-sm"
            required
          />
        </Field>

        <Field label="Token color (hex, 32 bytes)">
          <div className="flex gap-2">
            <input
              value={tokenColor}
              onChange={(e) => setTokenColor(e.target.value)}
              className="input-field w-full rounded-lg px-3 py-2 font-mono text-xs"
              required
            />
            <button type="button" onClick={() => setTokenColor(randomHex32())} className="btn-ghost shrink-0 rounded-lg px-3 py-2 text-xs">
              Randomize
            </button>
          </div>
        </Field>

        <Field label="Expires in (days)">
          <input
            value={days}
            onChange={(e) => setDays(e.target.value)}
            inputMode="numeric"
            className="input-field w-full rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        <Field label="Private notes (hashed on-chain, never stored there)">
          <textarea
            value={metadataNote}
            onChange={(e) => setMetadataNote(e.target.value)}
            rows={3}
            className="input-field w-full rounded-lg px-3 py-2 text-sm"
          />
        </Field>

        {error && <p className="rounded-lg bg-[var(--danger-bg)] px-4 py-3 text-sm text-[var(--danger)]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full rounded-full px-6 py-3 text-sm font-medium disabled:cursor-not-allowed"
        >
          {submitting ? "Registering on-chain…" : "Create invoice"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.trim().toLowerCase();
  const out = new Uint8Array(32);
  const bytes = clean.match(/.{1,2}/g) ?? [];
  bytes.slice(0, 32).forEach((b, i) => (out[i] = parseInt(b, 16)));
  return out;
};

const sha256 = async (text: string): Promise<Uint8Array> => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
};
