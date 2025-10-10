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
              <div className="bg-green-900/20 border border-green-500/20 backdrop-blur-sm rounded-xl">
                <div className="mx-auto max-w-7xl">
                  <div className=" py-6">
                    <div className="whitespace-nowrap">
                      <div className="flow-root">
                        <div className="-my-2 overflow-x-auto">
                          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <table className="min-w-full divide-y divide-gray-700">
                              <thead>
                                <tr>
                                  <th
                                    scope="col"
                                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-0"
                                  >
                                    ID
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                                  >
                                    Payment Date
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white "
                                  >
                                    Payment Amount
                                  </th>
                                  <th
                                    scope="col"
                                    className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                                  >
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-800">
                                {transactions?.map((transaction, index) => (
                                  <tr key={index}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-0">
                                      {transaction.id.slice(-12)}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
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
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                      {(transaction.amount ?? 0.0) / 100}{" "}
                                      {transaction.currency}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
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
