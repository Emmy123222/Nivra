import { InvoiceRegistry } from "@nivra/contracts";

export const STATUS_LABEL: Record<InvoiceRegistry.InvoiceState, string> = {
  [InvoiceRegistry.InvoiceState.ACTIVE]: "Active",
  [InvoiceRegistry.InvoiceState.PAID]: "Paid",
  [InvoiceRegistry.InvoiceState.CANCELLED]: "Cancelled",
  [InvoiceRegistry.InvoiceState.EXPIRED]: "Expired",
};

export const STATUS_COLOR: Record<InvoiceRegistry.InvoiceState, string> = {
  [InvoiceRegistry.InvoiceState.ACTIVE]: "bg-[var(--info-bg)] text-[var(--info)] ring-[var(--info)]/25",
  [InvoiceRegistry.InvoiceState.PAID]: "bg-[var(--success-bg)] text-[var(--success)] ring-[var(--success)]/25",
  [InvoiceRegistry.InvoiceState.CANCELLED]: "bg-[var(--surface-hover)] text-[var(--text-secondary)] ring-[var(--border-strong)]",
  [InvoiceRegistry.InvoiceState.EXPIRED]: "bg-[var(--warning-bg)] text-[var(--warning)] ring-[var(--warning)]/25",
};
