import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { PlusCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { PaymentMethod } from '../../types';

const Expenses: React.FC = () => {
  const { expenses = [], addExpense, deleteExpense, customers = [] } = useAppContext() as any;
  const [isAddOpen, setAddOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paidFrom, setPaidFrom] = useState<PaymentMethod>(PaymentMethod.Caixa);
  const [affectsProfit, setAffectsProfit] = useState<boolean>(true);
  const [useCustomer, setUseCustomer] = useState<boolean>(false);
  const [customerId, setCustomerId] = useState<string>('');

  const total = useMemo(() => (expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0), [expenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) return;
    await addExpense(description.trim(), amount, new Date().toISOString(), useCustomer ? 'Cliente' : paidFrom, affectsProfit, useCustomer ? customerId : undefined);
    setDescription(''); setAmount(0); setPaidFrom(PaymentMethod.Caixa); setAffectsProfit(true); setUseCustomer(false); setCustomerId('');
    setAddOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta despesa?')) await deleteExpense(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Despesas</h1>
        <button onClick={() => setAddOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
          <PlusCircle size={20} className="mr-2" /> Nova Despesa
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Descrição</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Lucro</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(expenses || []).slice().reverse().map((e: any) => (
              <tr key={e.id} className="border-t dark:border-gray-700">
                <td className="p-3">{new Date(e.date).toLocaleString()}</td>
                <td className="p-3">{e.description}</td>
                <td className="p-3">{String(e.paidFrom || e.customerId ? 'Cliente' : '-')}</td>
                <td className="p-3">{e.affectsProfit === false ? 'Não' : 'Sim'}</td>
                <td className="p-3 text-right">{formatCurrency(e.amount)}</td>
                <td className="p-3 text-center"><button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
              </tr>
            ))}
            {(!expenses || expenses.length === 0) && (<tr><td className="p-4 text-gray-500" colSpan={6}>Nenhuma despesa lançada</td></tr>)}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
              <td className="p-3" colSpan={4}>Total</td>
              <td className="p-3 text-right">{formatCurrency(total)}</td>
              <td className="p-3" />
            </tr>
          </tfoot>
        </table>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setAddOpen(false)} title="Nova Despesa">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Valor</label>
              <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium">Pago de</label>
              <select value={paidFrom} onChange={(e) => setPaidFrom(e.target.value as unknown as PaymentMethod)} disabled={useCustomer} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                <option value={PaymentMethod.Caixa}>Caixa</option>
                <option value={PaymentMethod.Cash}>À Vista</option>
                <option value={PaymentMethod.Check}>Cheque</option>
                <option value={PaymentMethod.Pix}>Pix</option>
                <option value={PaymentMethod.Expense}>Despesa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="affectsProfit" type="checkbox" checked={affectsProfit} onChange={(e) => setAffectsProfit(e.target.checked)} />
              <label htmlFor="affectsProfit" className="text-sm">Abater do lucro</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="useCustomer" type="checkbox" checked={useCustomer} onChange={(e) => setUseCustomer(e.target.checked)} />
              <label htmlFor="useCustomer" className="text-sm">Pagar diretamente do cliente</label>
            </div>
          </div>
          {useCustomer && (
            <div>
              <label className="block text-sm font-medium">Cliente</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required>
                <option value="">Selecione um cliente</option>
                {customers.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          )}
          <div className="text-right">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Lançar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;

