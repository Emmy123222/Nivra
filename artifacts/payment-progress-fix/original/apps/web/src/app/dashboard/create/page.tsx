"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bytesToHex } from "@nivra/sdk";
import { useWallet } from "@/lib/wallet-context";
import { addStoredInvoice } from "@/lib/invoice-store";

type WalletToken = { type: string; encoded: string; balance: bigint };

// Public Preprod test asset previously recorded in docs/TESTNET_ADDRESSES.md.
// Merchants do not need to own the settlement asset to issue an invoice, so it
// remains usable when a wallet cannot serve its optional balance preview.
const SAVED_PREPROD_TOKEN_COLOR = "e41a0d35c72ef2acb6eb4384611725b5c906a59829b3e8fb4dff3f292718ef5e";
const normalizeTokenColor = (value: string) => value.trim().replace(/^0x/i, "").toLowerCase();
const isTokenColor = (value: string) => /^[0-9a-f]{64}$/.test(normalizeTokenColor(value));

// Assumed convention, not yet verified against a live network (no Docker/proof
// server available in this sandbox — see docs/TOOLCHAIN.md): `expiry` is
// seconds since the Unix epoch, matching block-timestamp conventions used by
// most chains. Confirm against Preprod's actual clock before relying on this
// for a real deployment.
const nowPlusDays = (days: number) => BigInt(Math.floor(Date.now() / 1000) + days * 86_400);

export default function CreateInvoicePage() {
  const router = useRouter();
  const { status, contract, connectedApi, ensureContract } = useWallet();
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [tokenColor, setTokenColor] = useState(SAVED_PREPROD_TOKEN_COLOR);
  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceRetry, setBalanceRetry] = useState(0);
  const [days, setDays] = useState("7");
  const [metadataNote, setMetadataNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connectedApi) return;
    let cancelled = false;
    setLoadingTokens(true);
    setBalanceError(null);
    void connectedApi
      .getShieldedBalances()
      .then((balances) => {
        if (cancelled) return;
        const tokens = Object.entries(balances)
          .filter(([, balance]) => balance > BigInt(0))
          // DApp Connector token types are already hex-encoded raw token types.
          // Avoid round-tripping them through the ledger WASM just to display/select one.
          .map(([type, balance]) => ({ type, balance, encoded: type.toLowerCase() }));
        setWalletTokens(tokens);
        setTokenColor((current) => {
          const normalized = normalizeTokenColor(current);
          return tokens.some((token) => token.encoded === normalized)
            ? normalized
            : tokens[0]?.encoded || normalized || SAVED_PREPROD_TOKEN_COLOR;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setWalletTokens([]);
        setBalanceError("Wallet balance lookup is temporarily unavailable. The saved token color below can still be used.");
      })
      .finally(() => {
        if (!cancelled) setLoadingTokens(false);
      });
    return () => { cancelled = true; };
  }, [connectedApi, balanceRetry]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let parsedAmount: bigint;
    try {
      parsedAmount = BigInt(amount);
    } catch {
      setError("Enter a whole-number amount.");
      return;
    }
    if (parsedAmount <= BigInt(0) || parsedAmount > (BigInt(2) ** BigInt(64) - BigInt(1))) {
      setError("Amount must be between 1 and the Uint64 maximum.");
      return;
    }
    const normalizedTokenColor = normalizeTokenColor(tokenColor);
    if (!isTokenColor(normalizedTokenColor)) {
      setError("Token color must contain exactly 64 hexadecimal characters.");
      return;
    }
    const parsedDays = Number(days);
    if (!Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 3650) {
      setError("Expiry must be between 1 and 3650 whole days.");
      return;
    }
    setSubmitting(true);
    try {
      const deployed = contract ?? (await ensureContract());

      const invoice = {
        amount: parsedAmount,
        tokenColor: hexToBytes(normalizedTokenColor),
        expiry: nowPlusDays(parsedDays),
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
      if (!connectedApi) throw new Error("Wallet connection was lost while creating the invoice.");
      const addresses = await connectedApi.getShieldedAddresses();

      addStoredInvoice({
        commitment: commitmentHex,
        amount: invoice.amount.toString(),
        tokenColor: normalizedTokenColor,
        expiry: invoice.expiry.toString(),
        metadataHash: bytesToHex(invoice.metadataHash),
        invoiceSecret: bytesToHex(invoice.invoiceSecret),
        nonce: bytesToHex(invoice.nonce),
        merchantPayoutKey: addresses.shieldedCoinPublicKey,
        merchantEncryptionPublicKey: addresses.shieldedEncryptionPublicKey,
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

        <Field label="Settlement token">
          {loadingTokens ? (
            <div className="input-field w-full rounded-lg px-3 py-2 text-sm text-[var(--text-muted)]">Reading wallet balances…</div>
          ) : walletTokens.length > 0 ? (
            <select
              value={tokenColor}
              onChange={(e) => setTokenColor(e.target.value)}
              className="input-field w-full rounded-lg px-3 py-2 text-sm"
              required
            >
              {walletTokens.map((token) => (
                <option key={token.type} value={token.encoded}>
                  {token.type.slice(0, 18)}{token.type.length > 18 ? "…" : ""} — {token.balance.toString()} available
                </option>
              ))}
            </select>
          ) : (
            <input
              value={tokenColor}
              onChange={(e) => setTokenColor(e.target.value)}
              placeholder="64-character token color"
              spellCheck={false}
              className="input-field w-full rounded-lg px-3 py-2 font-mono text-xs"
              required
            />
          )}
        </Field>

        {balanceError && (
          <div className="rounded-lg bg-[var(--warning-bg)] px-4 py-3 text-xs leading-5 text-[var(--warning)]">
            <p>{balanceError}</p>
            <button type="button" onClick={() => setBalanceRetry((value) => value + 1)} className="mt-1 font-semibold underline">
              Retry wallet lookup
            </button>
          </div>
        )}

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
  const clean = normalizeTokenColor(hex);
  if (!/^[0-9a-f]{64}$/.test(clean)) throw new Error("Token color must contain exactly 64 hexadecimal characters.");
  return new Uint8Array(clean.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
};

const sha256 = async (text: string): Promise<Uint8Array> => {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
};
