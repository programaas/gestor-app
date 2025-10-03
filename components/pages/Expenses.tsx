import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import Modal from '../ui/Modal.tsx';
import { PlusCircle, Receipt } from 'lucide-react';

const Expenses: React.FC = () => {
    const { expenses, addExpense, caixaBalance } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState<number | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const resetForm = () => {
        setDescription('');
        setAmount('');
        setIsModalOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numericAmount = Number(amount);
        if (description.trim() && numericAmount > 0) {
            addExpense(description.trim(), numericAmount);
            resetForm();
        } else {
            alert('Por favor, preencha a descrição e um valor válido.');
        }
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                if (startDate && new Date(startDate) > expenseDate) return false;
                if (endDate && new Date(endDate) < expenseDate) return false;
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, startDate, endDate]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Despesas</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Despesa (do Caixa)
                </button>
            </div>
            
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 flex items-center gap-4">
                <label className="font-semibold">Filtrar por Período:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
                <span>até</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md"/>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Descrição</th>
                            <th className="p-4 font-semibold">Origem</th>
                            <th className="p-4 font-semibold text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="border-b dark:border-gray-700">
                                <td className="p-4">{new Date(expense.date).toLocaleString()}</td>
                                <td className="p-4 flex items-center"><Receipt size={16} className="mr-2 text-gray-500" />{expense.description}</td>
                                <td className="p-4">{expense.source}</td>
                                <td className="p-4 text-right font-medium text-red-500">{formatCurrency(expense.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title="Registrar Nova Despesa">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Esta despesa será paga com o saldo do seu Caixa.
                        <br/>
                        Saldo atual do Caixa: <strong>{formatCurrency(caixaBalance)}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium">Descrição</label>
                        <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Valor</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 block w-full" step="0.01" min="0.01" required />
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