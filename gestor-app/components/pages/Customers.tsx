import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Customer, PaymentMethod } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, User, Download } from 'lucide-react';

const Customers: React.FC = () => {
    const { customers, addCustomer, addCustomerPayment, suppliers, sales, products, customerPayments } = useAppContext();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Pix);
    const [allocations, setAllocations] = useState<{ supplierId: string, amount: number }[]>([]);
    const [isExpense, setIsExpense] = useState(false);
    const [expenseDescription, setExpenseDescription] = useState('');

    const handleAddCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addCustomer(newName.trim());
            setNewName('');
            setAddModalOpen(false);
        }
    };

    const handleOpenPayModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setPaymentAmount('');
        setAllocations([]);
        setIsExpense(false);
        setExpenseDescription('');
        setPayModalOpen(true);
    };
    
    const handleOpenDetailModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDetailModalOpen(true);
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(paymentAmount);
        if (selectedCustomer && amount > 0) {
            if (isExpense && !expenseDescription.trim()) {
                alert('A descrição da despesa é obrigatória.');
                return;
            }
            const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
             if (!isExpense && totalAllocated > amount) {
                alert('O valor total alocado aos fornecedores não pode exceder o valor do pagamento.');
                return;
            }
            addCustomerPayment(selectedCustomer.id, amount, paymentMethod, isExpense ? [] : allocations, isExpense ? { description: expenseDescription } : undefined);
            setPayModalOpen(false);
        }
    };
    
    const handleAllocationChange = (supplierId: string, amount: string) => {
        const numericAmount = parseFloat(amount) || 0;
        setAllocations(prev => {
            const otherAllocations = prev.filter(a => a.supplierId !== supplierId);
            if (numericAmount > 0) {
                 return [...otherAllocations, { supplierId, amount: numericAmount }];
            }
            return otherAllocations;
        });
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    
    const customerSales = sales.filter(s => s.customerId === selectedCustomer?.id);
    const customerPaymentHistory = customerPayments.filter(p => p.customerId === selectedCustomer?.id);

    const handleExport = () => {
        if (!selectedCustomer) return;

        let reportHtml = `
            <html><head><title>Extrato - ${selectedCustomer.name}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 2rem; color: #333; }
                h1, h2 { color: #0056b3; } h2 { border-bottom: 2px solid #0056b3; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                th { background-color: #f0f0f0; }
                .text-right { text-align: right; }
                .total { font-weight: bold; font-size: 1.2rem; margin-top: 1.5rem; text-align: right; }
                .debit { color: #c00; } .credit { color: #080; }
            </style>
            </head><body>
            <h1>Extrato de Conta</h1>
            <h2>Cliente: ${selectedCustomer.name}</h2>
            <p>Data de Emissão: ${new Date().toLocaleDateString()}</p>
            <table><thead><tr>
                <th>Data</th><th>Descrição</th><th class="text-right">Débito</th><th class="text-right">Crédito</th>
            </tr></thead><tbody>`;

        const transactions = [
            ...customerSales.flatMap(s => s.items.map(item => ({
                date: s.date,
                description: `${item.quantity}x ${products.find(p => p.id === item.productId)?.name || 'N/A'}`,
                amount: item.quantity * item.unitPrice,
                type: 'debit'
            }))),
            ...customerPaymentHistory.map(p => ({
                date: p.date,
                description: `Pagamento (${p.method})`,
                amount: p.amount,
                type: 'credit'
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        transactions.forEach(tx => {
            reportHtml += `<tr>
                <td>${new Date(tx.date).toLocaleDateString()}</td>
                <td>${tx.description}</td>
                <td class="text-right debit">${tx.type === 'debit' ? formatCurrency(tx.amount) : ''}</td>
                <td class="text-right credit">${tx.type === 'credit' ? formatCurrency(tx.amount) : ''}</td>
            </tr>`;
        });

        reportHtml += `</tbody></table>
            <div class="total">Saldo Devedor Final: <span class="debit">${formatCurrency(selectedCustomer.balance)}</span></div>
            </body></html>`;

        const reportWindow = window.open('', '_blank');
        reportWindow?.document.write(reportHtml);
        reportWindow?.document.close();
        reportWindow?.print();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Clientes</h1>
                <button onClick={() => setAddModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Adicionar Cliente
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">Saldo Devedor</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map(customer => (
                            <tr key={customer.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><User size={16} className="mr-2 text-gray-500" />{customer.name}</td>
                                <td className={`p-4 font-medium ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(customer.balance)}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleOpenDetailModal(customer)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4">Detalhes</button>
                                    <button onClick={() => handleOpenPayModal(customer)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Pagar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Novo Cliente">
                <form onSubmit={handleAddCustomer}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                        <input type="text" id="name" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Salvar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title={`Registrar Pagamento de ${selectedCustomer?.name}`}>
                 <form onSubmit={handleAddPayment} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Valor do Pagamento</label>
                        <input type="number" value={paymentAmount} placeholder={formatCurrency(selectedCustomer?.balance || 0)} onChange={e => setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" required />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Você pode registrar um pagamento parcial ou total.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Forma de Pagamento</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center">
                            <input type="checkbox" checked={isExpense} onChange={e => setIsExpense(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <span className="ml-2 text-sm">Registrar como despesa</span>
                        </label>
                    </div>
                    {isExpense ? (
                         <div>
                            <label className="block text-sm font-medium">Descrição da Despesa</label>
                            <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required={isExpense} />
                        </div>
                    ) : (
                        <div>
                            <h4 className="text-md font-medium mb-2">Alocar pagamento para fornecedores (Opcional)</h4>
                             <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                                Você pode direcionar parte ou todo o pagamento para um ou mais fornecedores. O valor restante será adicionado ao Caixa.
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {suppliers.filter(s => s.balance > 0).map(supplier => (
                                    <div key={supplier.id} className="flex items-center justify-between">
                                        <label className="text-sm">{supplier.name} <span className="text-xs text-gray-500">({formatCurrency(supplier.balance)})</span></label>
                                        <input type="number" placeholder="0.00" onChange={e => handleAllocationChange(supplier.id, e.target.value)} className="w-32 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md" step="0.01" min="0" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 pt-3 border-t dark:border-gray-600 text-sm text-right">
                                <p>Total Alocado: <span className="font-semibold">{formatCurrency(allocations.reduce((sum, alloc) => sum + alloc.amount, 0))}</span></p>
                                <p>Valor para o Caixa: <span className="font-semibold">{formatCurrency(Math.max(0, Number(paymentAmount) - allocations.reduce((sum, alloc) => sum + alloc.amount, 0)))}</span></p>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Confirmar Pagamento</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Detalhes de ${selectedCustomer?.name}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p><strong>Saldo Devedor:</strong> <span className="font-bold text-red-500">{formatCurrency(selectedCustomer?.balance || 0)}</span></p>
                        <button onClick={handleExport} className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 flex items-center text-sm">
                            <Download size={16} className="mr-2" /> Exportar Extrato
                        </button>
                    </div>
                    <h4 className="font-semibold mt-4 border-t pt-4">Histórico de Compras</h4>
                     <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                <tr className="text-left"><th className="p-2">Data</th><th className="p-2">Produto</th><th className="p-2">Qtd.</th><th className="p-2">Valor Unit.</th><th className="p-2">Total</th></tr>
                            </thead>
                            <tbody>
                               {customerSales.slice().reverse().flatMap(sale => sale.items.map((item, index) => (
                                    <tr key={`${sale.id}-${index}`} className="border-b dark:border-gray-600">
                                        <td className="p-2">{index === 0 ? new Date(sale.date).toLocaleDateString() : ''}</td>
                                        <td className="p-2">{products.find(p => p.id === item.productId)?.name || 'N/A'}</td>
                                        <td className="p-2">{item.quantity}</td>
                                        <td className="p-2">{formatCurrency(item.unitPrice)}</td>
                                        <td className="p-2">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="font-semibold mt-4 border-t pt-4">Histórico de Pagamentos</h4>
                     <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                <tr className="text-left"><th className="p-2">Data</th><th className="p-2">Valor</th><th className="p-2">Método</th></tr>
                            </thead>
                            <tbody>
                               {customerPaymentHistory.slice().reverse().map(payment => (
                                    <tr key={payment.id} className="border-b dark:border-gray-600">
                                        <td className="p-2">{new Date(payment.date).toLocaleDateString()}</td>
                                        <td className="p-2 text-green-500">{formatCurrency(payment.amount)}</td>
                                        <td className="p-2">{payment.method}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Customers;