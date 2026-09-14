import { InvoiceRegistry } from "@nivra/contracts";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";

export function StatusBadge({ state }: { state: InvoiceRegistry.InvoiceState }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_COLOR[state]}`}
    >
      {STATUS_LABEL[state]}
    </span>
  );
}
