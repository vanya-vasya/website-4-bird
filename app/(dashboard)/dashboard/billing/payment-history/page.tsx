import { FeatureContainer } from "@/components/feature-container";
import { contentStyles } from "@/components/ui/feature-styles";
import { fetchPaymentHistory } from "@/lib/api-limit";

const PaymentHistoryPage = async () => {
  const transactions = await fetchPaymentHistory();
  return (
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
                                Payment Amouint
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                              >
                                Status
                              </th>
                              <th
                                scope="col"
                                className="px-3 py-3.5 text-left text-sm font-semibold text-white"
                              >
                                Receipt
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
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                                  {transaction.receipt_url && transaction.status === 'success' ? (
                                    <a
                                      href={transaction.receipt_url}
                                      download={`receipt_${transaction.id.slice(-12)}.pdf`}
                                      className="text-green-400 hover:text-green-300 underline flex items-center gap-1"
                                      aria-label={`Download receipt for transaction ${transaction.id.slice(-12)}`}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      Download
                                    </a>
                                  ) : (
                                    <span className="text-gray-500 text-xs">N/A</span>
                                  )}
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
  );
};

export default PaymentHistoryPage;
