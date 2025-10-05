
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { DollarSign, ArrowRight } from 'lucide-react';

const Cash: React.FC = () => {
    const { customerPayments, expenses } = useAppContext();

    // Filter payments and expenses related to 'Caixa'
    const cashInflows = customerPayments.filter(p => p.method === 'Caixa');
    const cashOutflows = expenses.filter(e => e.paidFrom === 'Caixa'); // Assuming expenses can be paid from Caixa

    const totalInflows = cashInflows.reduce((acc, p) => acc + p.amount, 0);
    const totalOutflows = cashOutflows.reduce((acc, e) => acc + e.amount, 0);
    const balance = totalInflows - totalOutflows;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Caixa</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">Entradas</h2>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatCurrency(totalInflows)}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Saídas</h2>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(totalOutflows)}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Saldo Atual</h2>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(balance)}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                 <h2 className="text-xl font-bold p-4">Movimentações do Caixa</h2>
                 <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold">Data</th>
                                <th className="p-4 font-semibold">Descrição</th>
                                <th className="p-4 font-semibold text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...cashInflows, ...cashOutflows]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(item => (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <td className="p-4">{new Date(item.date).toLocaleString()}</td>
                                        <td className="p-4">
                                            {'customerId' in item ? `Pagamento de cliente` : `Pagamento de despesa: ${item.description}`}
                                        </td>
                                        <td className={`p-4 text-right font-semibold ${'customerId' in item ? 'text-green-600' : 'text-red-600'}`}>
                                            {'customerId' in item ? '+' : '-'} {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default Cash;
