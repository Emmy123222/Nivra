"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { InvoiceRegistry } from "@nivra/contracts";
import { hexToBytes } from "@nivra/sdk";
import { useWallet } from "@/lib/wallet-context";
import { listStoredInvoices, type StoredInvoice } from "@/lib/invoice-store";
import { StatusBadge } from "@/components/status-badge";
import { LACE_WALLET_URL } from "@/lib/wallet-links";

type Row = { invoice: StoredInvoice; state: InvoiceRegistry.InvoiceState | null };
type PreviewRow = { id: string; client: string; amount: string; date: string; status: "Paid" | "Active" | "Draft" };
type InvoiceFilter = "all" | "active" | "paid";

const PREVIEW_ROWS: PreviewRow[] = [
  { id: "NV-1042", client: "Northstar Studio", amount: "12,400", date: "Sep 14", status: "Paid" },
  { id: "NV-1041", client: "Private client", amount: "8,250", date: "Sep 12", status: "Active" },
  { id: "NV-1040", client: "Orbit Systems", amount: "4,900", date: "Sep 08", status: "Paid" },
  { id: "NV-1039", client: "Private client", amount: "6,910", date: "Sep 02", status: "Draft" },
];

export default function DashboardPage() {
  const {
    status,
    contract,
    connecting,
    deployingContract,
    walletAvailable,
    connect,
    ensureContract,
    getLedger,
  } = useWallet();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<InvoiceFilter>("all");
  const connected = status === "connected";

  const refresh = useCallback(async () => {
    const stored = listStoredInvoices();
    try {
      const ledger = await getLedger();
      setRows(
        stored.map((invoice) => ({
          invoice,
          state: ledger?.invoices.member(hexToBytes(invoice.commitment))
            ? ledger.invoices.lookup(hexToBytes(invoice.commitment)).state
            : null,
        })),
      );
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
      setRows(stored.map((invoice) => ({ invoice, state: null })));
    }
  }, [getLedger]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (contract) {
        await refresh();
        return;
      }
      const stored = listStoredInvoices().map((invoice) => ({ invoice, state: null }));
      if (!cancelled) setRows(stored);
    })();
    return () => { cancelled = true; };
  }, [contract, refresh]);

  const stats = useMemo(() => {
    if (!connected) return { volume: "32,460", paid: "2", active: "1", rate: "96.4%" };
    const current = rows ?? [];
    const volume = current.reduce((total, row) => total + BigInt(row.invoice.amount || "0"), BigInt(0));
    const paid = current.filter((row) => row.state === InvoiceRegistry.InvoiceState.PAID).length;
    const active = current.filter((row) => row.state === InvoiceRegistry.InvoiceState.ACTIVE).length;
    const rate = current.length ? `${Math.round((paid / current.length) * 100)}%` : "—";
    return { volume: formatAmount(volume), paid: String(paid), active: String(active), rate };
  }, [connected, rows]);
  const filteredRows = useMemo(() => {
    if (!rows || filter === "all") return rows;
    const target = filter === "active" ? InvoiceRegistry.InvoiceState.ACTIVE : InvoiceRegistry.InvoiceState.PAID;
    return rows.filter((row) => row.state === target);
  }, [rows, filter]);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
      <header className="fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--text-muted)]">
            Merchant workspace
            {!connected && <span className="rounded-full bg-[rgba(199,255,94,.1)] px-2.5 py-1 text-[9px] tracking-[.12em] text-[var(--accent)]">Preview data</span>}
          </div>
          <h1 className="mt-3 text-3xl font-medium tracking-[-.045em] sm:text-4xl">Good evening, merchant.</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Here&apos;s the private pulse of your business.</p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <Link href="/dashboard/create" className="btn-primary rounded-full px-5 py-2.5 text-xs font-semibold">
              <PlusIcon /> New invoice
            </Link>
          ) : walletAvailable === false ? (
            <a href={LACE_WALLET_URL} target="_blank" rel="noreferrer" className="btn-primary rounded-full px-5 py-2.5 text-xs font-semibold">
              Install Lace wallet <ArrowIcon />
            </a>
          ) : (
            <button type="button" onClick={() => void connect()} disabled={connecting} className="btn-primary rounded-full px-5 py-2.5 text-xs font-semibold">
              {connecting ? "Checking browser…" : "Connect wallet"} <ArrowIcon />
            </button>
          )}
        </div>
      </header>

      {!connected && (
        <section className="fade-up mt-8 flex flex-col gap-5 rounded-2xl border border-[rgba(199,255,94,.18)] bg-[linear-gradient(100deg,rgba(199,255,94,.095),rgba(122,231,219,.035))] p-5 sm:flex-row sm:items-center sm:justify-between" style={{ animationDelay: "50ms" }}>
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]"><WalletIcon /></span>
            <div><p className="text-sm font-semibold">{walletAvailable === false ? "Lace wallet is available for Midnight" : "Connect to open your live workspace"}</p><p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{walletAvailable === false ? "This browser does not have a compatible wallet extension. Install Lace, unlock it, then reload Nivra." : "The information below is a clearly marked preview. Your real invoices appear after connection."}</p></div>
          </div>
          <a href={LACE_WALLET_URL} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline">Get Lace for Midnight ↗</a>
        </section>
      )}

      {connected && !contract && (
        <section className="fade-up mt-8 flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(199,255,94,.1)] text-[var(--accent)]"><RegistryIcon /></span><div><p className="text-sm font-semibold">Finish setting up your private registry</p><p className="mt-1 text-xs text-[var(--text-muted)]">One on-chain setup creates your merchant workspace. Your credential stays in this browser.</p></div></div>
          <button type="button" onClick={() => void ensureContract()} disabled={deployingContract} className="btn-primary shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold">{deployingContract ? "Deploying registry…" : "Set up registry"}</button>
        </section>
      )}

      {loadError && <p className="mt-5 rounded-xl bg-[var(--warning-bg)] px-4 py-3 text-xs text-[var(--warning)]">On-chain refresh paused: {loadError}</p>}

      <section className="fade-up mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" style={{ animationDelay: "80ms" }}>
        <StatCard label="Private volume" value={stats.volume} suffix="tDUST" note={connected ? "Across stored invoices" : "+18.2% this month"} chart={[28, 42, 35, 52, 47, 68, 82]} />
        <StatCard label="Settled invoices" value={stats.paid} note={connected ? "Verified on-chain" : "2 this week"} icon={<CheckIcon />} />
        <StatCard label="Active invoices" value={stats.active} note={connected ? "Awaiting settlement" : "12,400 tDUST due"} icon={<ClockIcon />} />
        <StatCard label="Settlement rate" value={stats.rate} note={connected ? "Of all invoices" : "+2.1% vs last month"} icon={<TrendIcon />} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.7fr)]">
        <div className="card fade-up overflow-hidden rounded-[1.35rem]" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-col gap-4 border-b border-[var(--border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="text-sm font-semibold">Recent invoices</h2><p className="mt-1 text-[11px] text-[var(--text-muted)]">{connected ? "Private records stored in this browser" : "Preview of your future workspace"}</p></div>
            <div className="flex items-center gap-2">
              <label className="btn-ghost flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-medium">
                <FilterIcon />
                <span className="sr-only">Filter invoices</span>
                <select value={filter} onChange={(event) => setFilter(event.target.value as InvoiceFilter)} className="bg-transparent outline-none">
                  <option value="all">All</option><option value="active">Active</option><option value="paid">Paid</option>
                </select>
              </label>
              {connected && <button type="button" onClick={() => void refresh()} className="text-[11px] font-semibold text-[var(--accent)] hover:underline">Refresh</button>}
            </div>
          </div>
          {!connected ? (
            <PreviewInvoiceTable filter={filter} />
          ) : rows === null ? (
            <TableMessage message="Loading private records…" />
          ) : rows.length === 0 ? (
            <div className="px-6 py-14 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-hover)] text-[var(--text-muted)]"><InvoiceIcon /></span><p className="mt-4 text-sm font-medium">No invoices yet</p><p className="mt-1 text-xs text-[var(--text-muted)]">Create your first private invoice to begin.</p><Link href="/dashboard/create" className="btn-primary mt-5 rounded-full px-5 py-2.5 text-xs font-semibold">Create invoice</Link></div>
          ) : (
            filteredRows?.length ? <ActualInvoiceTable rows={filteredRows} /> : <TableMessage message={`No ${filter} invoices found.`} />
          )}
        </div>

        <aside className="space-y-6">
          <div className="card fade-up rounded-[1.35rem] p-6" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold">Privacy health</p><p className="mt-1 text-[11px] text-[var(--text-muted)]">Data exposure monitor</p></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(199,255,94,.1)] text-[var(--accent)]"><ShieldIcon /></span></div>
            <div className="mt-7 flex items-end gap-2"><span className="text-4xl font-medium tracking-[-.05em]">100</span><span className="mb-1 text-sm text-[var(--accent)]">/100</span></div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]"><div className="h-full w-full rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-cyan))]" /></div>
            <ul className="mt-6 space-y-3 text-[11px] text-[var(--text-secondary)]"><HealthItem text="Invoice values concealed" /><HealthItem text="Customer identities private" /><HealthItem text="No centralized data store" /></ul>
          </div>
          <div className="card fade-up rounded-[1.35rem] p-6" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between"><p className="text-sm font-semibold">Settlement flow</p><span className="text-[10px] text-[var(--text-muted)]">Last 7 days</span></div>
            <div className="mt-7 flex h-28 items-end gap-2">{[32, 52, 38, 74, 56, 91, 70].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-[rgba(199,255,94,.14)] transition-colors hover:bg-[var(--accent)]" style={{ height: `${height}%` }} />)}</div>
            <div className="mt-3 flex justify-between text-[9px] uppercase tracking-wider text-[var(--text-muted)]"><span>Mon</span><span>Sun</span></div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function StatCard({ label, value, suffix, note, icon, chart }: { label: string; value: string; suffix?: string; note: string; icon?: React.ReactNode; chart?: number[] }) {
  return <article className="card min-h-36 rounded-[1.2rem] p-5"><div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]"><span>{label}</span>{icon && <span className="text-[var(--accent)]">{icon}</span>}</div><div className="mt-5 flex items-end gap-2"><strong className="text-2xl font-medium tracking-[-.04em]">{value}</strong>{suffix && <span className="mb-1 text-[10px] text-[var(--text-muted)]">{suffix}</span>}</div><div className="mt-4 flex items-end justify-between gap-3"><span className="text-[10px] text-[var(--text-muted)]">{note}</span>{chart && <span className="flex h-6 items-end gap-0.5">{chart.map((h, i) => <i key={i} className="w-1 rounded-sm bg-[var(--accent)] opacity-70" style={{ height: `${h}%` }} />)}</span>}</div></article>;
}

function PreviewInvoiceTable({ filter }: { filter: InvoiceFilter }) {
  const visible = filter === "all" ? PREVIEW_ROWS : PREVIEW_ROWS.filter((row) => row.status.toLowerCase() === filter);
  if (!visible.length) return <TableMessage message={`No ${filter} preview invoices found.`} />;
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><TableHead /><tbody className="divide-y divide-[var(--border)]">{visible.map((row) => <tr key={row.id} className="transition-colors hover:bg-[rgba(255,255,255,.025)]"><td className="px-6 py-4 font-mono text-[11px] text-[var(--text-muted)]">{row.id}</td><td className="px-4 py-4 text-xs font-medium">{row.client}</td><td className="px-4 py-4 text-xs">{row.amount} <span className="text-[9px] text-[var(--text-muted)]">tDUST</span></td><td className="px-4 py-4"><PreviewStatus status={row.status} /></td><td className="px-6 py-4 text-right text-[11px] text-[var(--text-muted)]">{row.date}</td></tr>)}</tbody></table></div>;
}

function ActualInvoiceTable({ rows }: { rows: Row[] }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left"><TableHead /><tbody className="divide-y divide-[var(--border)]">{rows.map(({ invoice, state }) => <tr key={invoice.commitment} className="transition-colors hover:bg-[rgba(255,255,255,.025)]"><td className="px-6 py-4 font-mono text-[11px] text-[var(--text-muted)]">{invoice.commitment.slice(0, 8)}…</td><td className="px-4 py-4"><Link href={`/dashboard/invoices/${invoice.commitment}`} className="text-xs font-medium hover:text-[var(--accent)]">{invoice.label || "Private invoice"}</Link></td><td className="px-4 py-4 text-xs">{invoice.amount} <span className="text-[9px] text-[var(--text-muted)]">tDUST</span></td><td className="px-4 py-4">{state !== null ? <StatusBadge state={state} /> : <span className="text-[10px] text-[var(--text-muted)]">Pending sync</span>}</td><td className="px-6 py-4 text-right text-[11px] text-[var(--text-muted)]">{new Date(invoice.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>;
}

function TableHead() { return <thead className="bg-[rgba(8,10,12,.55)] text-[9px] uppercase tracking-[.12em] text-[var(--text-muted)]"><tr><th className="px-6 py-3 font-medium">Invoice</th><th className="px-4 py-3 font-medium">Client / label</th><th className="px-4 py-3 font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 text-right font-medium">Date</th></tr></thead>; }
function TableMessage({ message }: { message: string }) { return <p className="px-6 py-14 text-center text-xs text-[var(--text-muted)]">{message}</p>; }
function PreviewStatus({ status }: { status: PreviewRow["status"] }) { const color = status === "Paid" ? "text-[var(--success)] bg-[var(--success-bg)]" : status === "Active" ? "text-[var(--info)] bg-[var(--info-bg)]" : "text-[var(--text-secondary)] bg-[var(--surface-hover)]"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${color}`}>{status}</span>; }
function HealthItem({ text }: { text: string }) { return <li className="flex items-center gap-2.5"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-[rgba(199,255,94,.1)] text-[var(--accent)]"><CheckIcon /></span>{text}</li>; }
function formatAmount(value: bigint) { return new Intl.NumberFormat("en-US").format(value); }

function PlusIcon() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>; }
function ArrowIcon() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function CheckIcon() { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="m3 8.5 3 3L13 4.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ClockIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 4.8v3.5l2.3 1.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function TrendIcon() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="m3 11 3.2-3.2 2.2 2.2L13 5.5M9.8 5.5H13v3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function FilterIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2.5 4h11M4.5 8h7M6.5 12h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function WalletIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M3 5.5h12.5A1.5 1.5 0 0 1 17 7v8H4.5A1.5 1.5 0 0 1 3 13.5v-8Zm0 0A2.5 2.5 0 0 1 5.5 3H15v2.5M14 9h3v3h-3a1.5 1.5 0 0 1 0-3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function RegistryIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path d="M5 3h10v14H5zM8 6h4M8 10h4M8 14h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function InvoiceIcon() { return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 2.5h7l3 3V17H5V2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M12 2.5v3h3M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function ShieldIcon() { return <svg width="19" height="19" viewBox="0 0 20 20" fill="none"><path d="M10 2.5 16 5v4.6c0 3.6-2.4 6.3-6 7.9-3.6-1.6-6-4.3-6-7.9V5l6-2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m7.2 9.8 1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
