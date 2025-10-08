import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../ui/Modal';

const Cash: React.FC = () => {
  const { cashTransactions = [], suppliers = [], paySupplierFromCash, addExpense, addCashWithdrawal } = useAppContext() as any;
  const [isPaySupplierOpen, setPaySupplierOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierAmount, setSupplierAmount] = useState<number>(0);
  const [isExpenseOpen, setExpenseOpen] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [withdrawDesc, setWithdrawDesc] = useState<string>('Saque');

  const balance = useMemo(() => {
    return (cashTransactions || []).reduce((sum: number, tx: any) => {
      const amt = Number(tx.amount) || 0;
      return sum + (tx.type === 'in' ? amt : -amt);
    }, 0);
  }, [cashTransactions]);

  const sorted = useMemo(() => {
    return (cashTransactions || []).slice().sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashTransactions]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Caixa</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setPaySupplierOpen(true)} className="bg-indigo-600 text-white px-3 py-2 rounded hover:bg-indigo-700">Pagar fornecedor</button>
          <button onClick={() => setExpenseOpen(true)} className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800">Nova despesa</button>
          <button onClick={() => setWithdrawOpen(true)} className="bg-amber-600 text-white px-3 py-2 rounded hover:bg-amber-700">Saque</button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow px-4 py-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">Saldo atual</div>
            <div className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(balance)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">Data</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Descrição</th>
              <th className="p-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx: any) => (
              <tr key={tx.id} className="border-t dark:border-gray-700">
                <td className="p-3">{new Date(tx.date).toLocaleString()}</td>
                <td className={`p-3 font-medium ${tx.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>{tx.type === 'in' ? 'Entrada' : (tx.type === 'withdraw' ? 'Saque' : 'Saída')}</td>
                <td className="p-3">{tx.description || '-'}</td>
                <td className={`p-3 text-right ${tx.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(Number(tx.amount) || 0)}</td>
              </tr>
            ))}
            {sorted.length === 0 && (<tr><td className="p-4 text-gray-500" colSpan={4}>Sem movimentações</td></tr>)}
          </tbody>
        </table>
      </div>

      {/* Modal: pagar fornecedor */}
      <Modal isOpen={isPaySupplierOpen} onClose={() => setPaySupplierOpen(false)} title="Pagar fornecedor">
        <form onSubmit={async (e) => { e.preventDefault(); if (!supplierId || supplierAmount <= 0) return; await paySupplierFromCash(supplierId, supplierAmount); setSupplierId(''); setSupplierAmount(0); setPaySupplierOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Fornecedor</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required>
              <option value="">Selecione</option>
              {suppliers.map((s: any) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Valor</label>
            <input type="number" min="0" step="0.01" value={supplierAmount} onChange={(e) => setSupplierAmount(Number(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
          </div>
          <div className="text-right">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Pagar</button>
          </div>
        </form>
      </Modal>

      {/* Modal: despesa do caixa */}
      <Modal isOpen={isExpenseOpen} onClose={() => setExpenseOpen(false)} title="Nova despesa (Caixa)">
        <form onSubmit={async (e) => { e.preventDefault(); if (!expenseDesc.trim() || expenseAmount <= 0) return; await addExpense(expenseDesc.trim(), expenseAmount, new Date().toISOString(), 'Caixa', true); setExpenseDesc(''); setExpenseAmount(0); setExpenseOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Valor</label>
            <input type="number" min="0" step="0.01" value={expenseAmount} onChange={(e) => setExpenseAmount(Number(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
          </div>
          <div className="text-right">
            <button type="submit" className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Lançar</button>
          </div>
        </form>
      </Modal>

      {/* Modal: saque */}
      <Modal isOpen={isWithdrawOpen} onClose={() => setWithdrawOpen(false)} title="Saque do caixa">
        <form onSubmit={async (e) => { e.preventDefault(); if (withdrawAmount <= 0) return; await addCashWithdrawal(withdrawAmount, withdrawDesc || 'Saque', true); setWithdrawAmount(0); setWithdrawDesc('Saque'); setWithdrawOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Valor</label>
            <input type="number" min="0" step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Descrição</label>
            <input value={withdrawDesc} onChange={(e) => setWithdrawDesc(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" />
          </div>
          <div className="text-right">
            <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">Sacar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cash;

