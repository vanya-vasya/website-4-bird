import { fetchPaymentHistory } from "@/lib/api-limit";
import PaymentHistoryClient from "./payment-history-client";
import { Eyebrow } from "@/components/fastbird";
import { Banknote } from "lucide-react";

const PaymentHistoryPage = async () => {
  const transactions = await fetchPaymentHistory();

  return (
    <PaymentHistoryClient transactions={transactions || []}>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Eyebrow>// BILLING</Eyebrow>
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-sand text-green">
              <Banknote className="h-5 w-5" aria-hidden />
            </div>
            <h1 className="font-heading text-h1 font-medium text-ink">Payments</h1>
          </div>
          <p className="text-[15px] text-ink-soft">
            Payment history made easy, all in one place.
          </p>
        </div>

        {/* Table */}
        {!transactions || transactions.length === 0 ? (
          <p className="font-mono text-sm text-ink-soft">No payment history yet.</p>
        ) : (
          <div className="overflow-hidden rounded-md border border-line bg-surface-card shadow-fb-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-line">
                <thead className="bg-sand">
                  <tr>
                    {["ID", "Payment Date", "Payment Amount", "Status"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-6 py-3.5 text-left font-mono text-xs uppercase tracking-[0.06em] text-ink-soft first:pl-6 last:pr-6"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-surface-card">
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="transition-colors hover:bg-sand/50">
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-ink">
                        {transaction.id.slice(-12)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-ink-soft">
                        {transaction.paid_at
                          ? new Intl.DateTimeFormat("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }).format(new Date(transaction.paid_at))
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-ink">
                        {(() => {
                          const amount = transaction.amount ?? 0;
                          const absAmount = Math.abs(amount) / 100;
                          const sign = amount < 0 ? "-" : "";
                          return `${sign}£${absAmount.toFixed(2)}`;
                        })()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-sand px-2.5 py-0.5 font-mono text-xs uppercase tracking-[0.04em] text-green">
                          {transaction.status
                            ? transaction.status.charAt(0).toUpperCase() +
                              transaction.status.slice(1)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PaymentHistoryClient>
  );
};

export default PaymentHistoryPage;
