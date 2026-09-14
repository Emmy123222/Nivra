import Link from "next/link";

const PRIVATE_FIELDS = ["Invoice amount", "Customer identity", "Line items", "Business notes"];
const PUBLIC_FIELDS = ["Proof of existence", "Lifecycle status", "Settlement proof"];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative isolate overflow-hidden border-b border-[var(--border)]">
        <div className="pointer-events-none absolute inset-0 grid-line opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="pointer-events-none absolute -right-48 top-[-24rem] h-[52rem] w-[52rem] rounded-full border border-[rgba(199,255,94,.12)]" />
        <div className="pointer-events-none absolute -right-20 top-[-15rem] h-[36rem] w-[36rem] rounded-full border border-[rgba(199,255,94,.1)]" />

        <div className="relative mx-auto grid min-h-[780px] max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.04fr_.96fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="eyebrow fade-up">Private commerce infrastructure</div>
            <h1 className="display-title fade-up mt-8 text-[clamp(3.5rem,7vw,7rem)] text-[var(--text-primary)]" style={{ animationDelay: "70ms" }}>
              Invoicing,<br />without the <span className="gradient-text">exposure.</span>
            </h1>
            <p className="fade-up mt-7 max-w-xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg" style={{ animationDelay: "130ms" }}>
              Create private invoices, accept shielded payments, and issue cryptographic receipts—while keeping your customers, pricing, and purchase history off the public ledger.
            </p>
            <div className="fade-up mt-10 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "190ms" }}>
              <Link href="/dashboard" className="btn-primary rounded-full px-6 py-3.5 text-sm font-semibold">
                Start invoicing <ArrowUpRight />
              </Link>
              <Link href="#how-it-works" className="btn-ghost rounded-full px-6 py-3.5 text-sm font-semibold">
                See how it works <PlayIcon />
              </Link>
            </div>
            <div className="fade-up mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-[var(--text-muted)]" style={{ animationDelay: "250ms" }}>
              <TrustItem text="No backend" />
              <TrustItem text="Non-custodial" />
              <TrustItem text="Midnight native" />
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section className="border-b border-[var(--border)] bg-[rgba(255,255,255,.018)]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[var(--border)] px-5 sm:px-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          <Metric value="100%" label="client-side privacy" />
          <Metric value="0" label="transaction details exposed" />
          <Metric value="1 proof" label="to verify settlement" />
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-28 sm:px-8 sm:py-36">
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24">
          <div>
            <div className="eyebrow">A quieter way to get paid</div>
            <h2 className="display-title mt-7 max-w-md text-4xl text-[var(--text-primary)] sm:text-6xl">From invoice to settlement in three private steps.</h2>
            <p className="mt-6 max-w-sm text-sm leading-6 text-[var(--text-secondary)]">The chain confirms what matters. Everything commercially sensitive stays where it belongs—with you and your customer.</p>
          </div>
          <div className="border-t border-[var(--border)]">
            <Step number="01" title="Create privately" description="Set the amount, expiry, and details in your browser. Only a cryptographic commitment is registered on-chain." icon={<ComposeIcon />} />
            <Step number="02" title="Share securely" description="Send a private payment link or QR code. Invoice data lives in the link fragment—not on a server." icon={<SendIcon />} />
            <Step number="03" title="Settle with proof" description="Your customer pays with a shielded transfer. Nivra records payment and creates a verifiable private receipt." icon={<ProofIcon />} />
          </div>
        </div>
      </section>

      <section id="privacy" className="border-y border-[var(--border)] bg-[#0b0e0f]">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="border-b border-[var(--border)] px-5 py-20 sm:px-8 lg:border-b-0 lg:border-r lg:py-28">
            <div className="eyebrow">Privacy by construction</div>
            <h2 className="display-title mt-7 max-w-lg text-4xl sm:text-6xl">Your business is not public data.</h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--text-secondary)]">Nivra uses zero-knowledge proofs and Midnight&apos;s dual-state architecture so invoice validity can be verified without revealing its contents.</p>
            <div className="mt-12 flex items-center gap-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)]"><ShieldIcon /></div>
              <div><p className="text-sm font-semibold">Minimize disclosure</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Prove a payment happened. Reveal nothing else.</p></div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2">
            <PrivacyList title="Stays private" items={PRIVATE_FIELDS} tone="private" />
            <PrivacyList title="Proven on-chain" items={PUBLIC_FIELDS} tone="public" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
        <div className="shine-border relative overflow-hidden rounded-[2rem] bg-[var(--accent)] px-6 py-16 text-center text-[var(--accent-ink)] sm:px-12 sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10" />
          <p className="relative text-xs font-bold uppercase tracking-[.18em]">Ready when you are</p>
          <h2 className="display-title relative mx-auto mt-5 max-w-3xl text-4xl sm:text-6xl">Make privacy your default payment setting.</h2>
          <Link href="/dashboard" className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-[#0a0d0d] px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-1">
            Open merchant dashboard <ArrowUpRight />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Nivra — private payments, proved publicly.</div>
          <div className="flex gap-6"><Link href="/connect" className="hover:text-[var(--text-primary)]">Wallet</Link><Link href="/dashboard" className="hover:text-[var(--text-primary)]">Dashboard</Link><span>Built on Midnight</span></div>
        </div>
      </footer>
    </main>
  );
}

function HeroVisual() {
  return (
    <div className="fade-up relative mx-auto w-full max-w-[540px] lg:mx-0" style={{ animationDelay: "180ms" }} aria-label="Private invoice preview">
      <div className="absolute -inset-14 -z-10 rounded-full bg-[rgba(199,255,94,.06)] blur-3xl" />
      <div className="float-slow relative">
        <div className="shine-border overflow-hidden rounded-[1.75rem] bg-[#111518] shadow-[0_45px_120px_rgba(0,0,0,.5)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-ink)]"><InvoiceIcon /></div><div><p className="text-[10px] uppercase tracking-[.14em] text-[var(--text-muted)]">Private invoice</p><p className="mt-0.5 text-sm font-semibold">Brand direction · Q3</p></div></div>
            <span className="rounded-full bg-[rgba(199,255,94,.1)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">Active</span>
          </div>
          <div className="px-6 py-8 sm:px-8">
            <div className="flex items-end justify-between"><div><p className="text-xs text-[var(--text-muted)]">Amount due</p><p className="mt-2 text-4xl font-medium tracking-[-.055em] sm:text-5xl">12,400 <span className="text-base tracking-normal text-[var(--text-muted)]">tDUST</span></p></div><div className="rounded-full border border-[var(--border)] p-3 text-[var(--accent)]"><LockIcon /></div></div>
            <div className="mt-9 h-px bg-[var(--border)]" />
            <div className="mt-6 grid grid-cols-2 gap-5 text-xs"><Info label="Client" value="Hidden" /><Info label="Due date" value="Sep 28, 2026" /><Info label="Invoice ID" value="NV–8F21" mono /><Info label="Network" value="Midnight" /></div>
            <div className="mt-8 rounded-2xl border border-[rgba(199,255,94,.16)] bg-[rgba(199,255,94,.05)] p-4">
              <div className="flex items-start gap-3"><div className="mt-0.5 text-[var(--accent)]"><ProofIcon /></div><div><p className="text-xs font-semibold text-[var(--accent-bright)]">Commitment verified</p><p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">Invoice exists on-chain. Private details remain concealed.</p></div></div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-7 -left-4 flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[#151a1c] px-4 py-3 shadow-2xl sm:-left-10"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)]"><CheckIcon /></span><div><p className="text-[10px] text-[var(--text-muted)]">Status update</p><p className="text-xs font-semibold">Payment protected</p></div></div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="py-8 text-center md:py-10"><p className="text-2xl font-medium tracking-[-.04em] text-[var(--accent-bright)]">{value}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{label}</p></div>; }
function TrustItem({ text }: { text: string }) { return <span className="inline-flex items-center gap-2"><CheckIcon /> {text}</span>; }
function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) { return <div><p className="text-[var(--text-muted)]">{label}</p><p className={`mt-1.5 font-medium text-[var(--text-primary)] ${mono ? "font-mono" : ""}`}>{value}</p></div>; }
function Step({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) { return <article className="group grid gap-4 border-b border-[var(--border)] py-8 sm:grid-cols-[3rem_1fr_3rem] sm:items-start sm:py-10"><span className="font-mono text-xs text-[var(--text-muted)]">{number}</span><div><h3 className="text-xl font-medium tracking-[-.025em] group-hover:text-[var(--accent-bright)]">{title}</h3><p className="mt-2 max-w-lg text-sm leading-6 text-[var(--text-secondary)]">{description}</p></div><span className="hidden h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-muted)] transition-all group-hover:border-[rgba(199,255,94,.3)] group-hover:text-[var(--accent)] sm:flex">{icon}</span></article>; }
function PrivacyList({ title, items, tone }: { title: string; items: string[]; tone: "private" | "public" }) { return <div className={`px-5 py-16 sm:px-8 sm:py-20 ${tone === "private" ? "border-b border-[var(--border)] sm:border-b-0 sm:border-r" : ""}`}><p className={`text-xs font-semibold uppercase tracking-[.14em] ${tone === "private" ? "text-[var(--accent)]" : "text-[var(--accent-cyan)]"}`}>{title}</p><ul className="mt-8 space-y-5">{items.map((item) => <li key={item} className="flex items-center gap-3 text-sm"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${tone === "private" ? "bg-[rgba(199,255,94,.1)] text-[var(--accent)]" : "bg-[rgba(122,231,219,.1)] text-[var(--accent-cyan)]"}`}><CheckIcon /></span>{item}</li>)}</ul></div>; }

function ArrowUpRight() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function PlayIcon() { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 4 5 4-5 4V4Z" fill="currentColor" /></svg>; }
function CheckIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m3 8.5 3 3L13 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LockIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 9V6.8a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function InvoiceIcon() { return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 3.5h7l3 3V17H5V3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 3.5v3h3M7.5 10h5M7.5 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function ComposeIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M11.8 4.2 15.8 8.2M4 16l1-4 8.6-8.6a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2L8 15l-4 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function SendIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m17 3-6.3 14-2.2-5.5L3 9.3 17 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m8.5 11.5 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function ProofIcon() { return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 2.5 16 5v4.6c0 3.6-2.4 6.3-6 7.9-3.6-1.6-6-4.3-6-7.9V5l6-2.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="m7.2 9.8 1.8 1.8 3.8-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function ShieldIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 20 6v5.5c0 4.5-3.2 7.8-8 9.5-4.8-1.7-8-5-8-9.5V6l8-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
