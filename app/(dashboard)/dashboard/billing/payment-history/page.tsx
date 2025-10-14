import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { fetchPaymentHistory } from "@/lib/api-limit";
import PaymentHistoryClient from "./payment-history-client";

const PaymentHistoryPage = async () => {
  const transactions = await fetchPaymentHistory();
  
  return (
    <PaymentHistoryClient transactions={transactions || []}>
      <div className="bg-white">
        <FeatureContainer
          title="Payments"
          description={`Payment history made easy, all in one place`}
          iconName={"Banknote"}
          gradient="from-green-400 via-green-500 to-green-600"
        >
          <div className={contentStyles.base}>
            {!transactions || transactions.length === 0 ? (
              <div className="text-center text-gray-300">
                {/* No payment history available */}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="mx-auto max-w-7xl">
                  <div className=" py-6">
                    <div className="whitespace-nowrap">
                      <div className="flow-root">
                        <div className="-my-2 overflow-x-auto">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead>
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left font-semibold sm:pl-0"
                                    style={{
                                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                      fontWeight: 600,
                                      fontSize: '14px',
                                      lineHeight: 1.2,
                                      letterSpacing: '0.01em',
                                      color: '#0f172a'
                                    }}
                                  >
                                    ID
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left font-semibold"
                                    style={{
                                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                      fontWeight: 600,
                                      fontSize: '14px',
                                      lineHeight: 1.2,
                                      letterSpacing: '0.01em',
                                      color: '#0f172a'
                                    }}
                                  >
                                    Payment Date
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left font-semibold"
                                    style={{
                                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                      fontWeight: 600,
                                      fontSize: '14px',
                                      lineHeight: 1.2,
                                      letterSpacing: '0.01em',
                                      color: '#0f172a'
                                    }}
                                  >
                                    Payment Amount
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left font-semibold"
                                    style={{
                                      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                      fontWeight: 600,
                                      fontSize: '14px',
                                      lineHeight: 1.2,
                                      letterSpacing: '0.01em',
                                      color: '#0f172a'
                                    }}
                                  >
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {transactions?.map((transaction, index) => (
                                  <tr key={index}>
                                    <td 
                                      className="whitespace-nowrap py-4 pl-4 pr-3 font-medium sm:pl-0"
                                      style={{
                                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        lineHeight: 1.2,
                                        letterSpacing: '0.01em',
                                        color: '#0f172a'
                                      }}
                                    >
                                      {transaction.id.slice(-12)}
                                    </td>
                                    <td 
                                      className="whitespace-nowrap px-3 py-4"
                                      style={{
                                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        lineHeight: 1.2,
                                        letterSpacing: '0.01em',
                                        color: '#0f172a'
                                      }}
                                    >
                                      {transaction.paid_at
                                        ? new Intl.DateTimeFormat("ru-RU", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          }).format(new Date(transaction.paid_at))
                                        : ""}
                                    </td>
                                    <td 
                                      className="whitespace-nowrap px-3 py-4"
                                      style={{
                                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        lineHeight: 1.2,
                                        letterSpacing: '0.01em',
                                        color: '#0f172a'
                                      }}
                                    >
                                      {(() => {
                                        const amount = transaction.amount ?? 0;
                                        const currency = transaction.currency?.toUpperCase() || 'GBP';
                                        const absAmount = Math.abs(amount) / 100;
                                        const sign = amount < 0 ? '-' : '';
                                        
                                        // Always display in GBP format with £ symbol
                                        return `${sign}£${absAmount.toFixed(2)}`;
                                      })()}
                                    </td>
                                    <td 
                                      className="whitespace-nowrap px-3 py-4"
                                      style={{
                                        fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '14px',
                                        lineHeight: 1.2,
                                        letterSpacing: '0.01em',
                                        color: '#0f172a'
                                      }}
                                    >
                                      {transaction.status
                                        ? transaction.status
                                            .charAt(0)
                                            .toUpperCase() +
                                          transaction.status.slice(1)
                                        : ""}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FeatureContainer>
      </div>
    </PaymentHistoryClient>
  );
};

export default PaymentHistoryPage;
