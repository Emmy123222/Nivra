import { InvoiceDetailsClient } from "./invoice-details-client";

export default async function InvoiceDetailsPage({ params }: { params: Promise<{ commitment: string }> }) {
  const { commitment } = await params;
  return <InvoiceDetailsClient commitment={commitment} />;
}
