
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Expense, PaymentMethod } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Expenses: React.FC = () => {
    const { expenses, addExpense } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState(0);
    const [paidFrom, setPaidFrom] = useState<PaymentMethod>(PaymentMethod.Caixa);

    const resetForm = () => {
        setDescription('');
        setAmount(0);
        setPaidFrom(PaymentMethod.Caixa);
        setIsModalOpen(false);
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || amount <= 0) {
            alert('Por favor, preencha a descrição e o valor da despesa.');
            return;
        }
        addExpense(description, amount, paidFrom);
        resetForm();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Despesas</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Despesa
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Descrição</th>
                            <th className="p-4 font-semibold">Pago de</th>
                            <th className="p-4 font-semibold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(expenses || []).slice().reverse().map(expense => (
                            <tr key={expense.id} className="border-b dark:border-gray-700">
                                <td className="p-4">{new Date(expense.date).toLocaleString()}</td>
                                <td className="p-4">{expense.description}</td>
                                <td className="p-4">{expense.paidFrom}</td>
                                <td className="p-4 text-right">{formatCurrency(expense.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title="Registrar Nova Despesa">
                <form onSubmit={handleAddExpense} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Descrição</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Valor</label>
                        <input type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value || '0'))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Pago de</label>
                        <select value={paidFrom} onChange={e => setPaidFrom(e.target.value as PaymentMethod)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            {Object.values(PaymentMethod).filter(m => m !== PaymentMethod.Expense).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Adicionar Despesa</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
