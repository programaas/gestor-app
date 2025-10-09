
import React, { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Customer, PaymentMethod } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, User, Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters'; // Caminho corrigido
import { generateCustomerReport } from '../../utils/reportGenerator';

const Customers: React.FC = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, addCustomerPayment, suppliers, sales, products, customerPayments } = useAppContext();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const [newName, setNewName] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Pix);
    const [allocations, setAllocations] = useState<{ supplierId: string, amount: number }[]>([]);
    const [cashAllocation, setCashAllocation] = useState<number>(0);

    const handleExportReport = (customer: Customer) => {
        generateCustomerReport(customer, sales, customerPayments, products);
    };

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
        setPaymentAmount(customer.balance > 0 ? customer.balance : 0);
        setAllocations([]);
        setPayModalOpen(true);
    };
    
    const handleOpenDetailModal = (customer: Customer) => {
        setSelectedCustomer(customer);
        setDetailModalOpen(true);
    };

    const handleOpenEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setNewName(customer.name);
        setEditModalOpen(true);
    };

    const handleUpdateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCustomer && newName.trim()) {
            updateCustomer(editingCustomer.id, newName.trim());
            setEditModalOpen(false);
            setEditingCustomer(null);
            setNewName('');
        }
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
            deleteCustomer(customerId);
        }
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedCustomer && paymentAmount > 0) {
            const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0) + (cashAllocation || 0);
            if(Math.abs(totalAllocated - paymentAmount) > 0.01) {
                alert('A soma alocada (fornecedores + caixa) deve ser igual ao valor do pagamento.');
                return;
            }
            addCustomerPayment(selectedCustomer.id, paymentAmount, paymentMethod, allocations, cashAllocation);
            setPayModalOpen(false);
        }
    };
    
    const handleAllocationChange = (supplierId: string, amount: string) => {
        const numericAmount = parseFloat(amount) || 0;
        setAllocations(prev => {
            const existing = prev.find(a => a.supplierId === supplierId);
            if (existing) {
                return prev.map(a => a.supplierId === supplierId ? { ...a, amount: numericAmount } : a);
            }
            return [...prev, { supplierId, amount: numericAmount }];
        });
    };
    
    const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);
    const customerSales = useMemo(() => (sales || []).filter(s => s.customerId === selectedCustomer?.id), [sales, selectedCustomer]);
    const customerPaymentsRows = useMemo(() => {
        if (!selectedCustomer) return [] as { id: string; date: string; amount: number; method?: string }[];
        return (customerPayments || [])
            .filter(cp => cp.customerId === selectedCustomer.id)
            .map(cp => ({ id: cp.id, date: cp.date, amount: cp.amount, method: (cp as any).method }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customerPayments, selectedCustomer]);

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
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">Saldo Devedor</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(customers || []).map(customer => (
                            <tr key={customer.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><User size={16} className="mr-2 text-gray-500" />{customer.name}</td>
                                <td className={`p-4 font-medium ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(customer.balance)}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenDetailModal(customer)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4">Detalhes</button>
                                    <button onClick={() => handleOpenEditModal(customer)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                    <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 dark:text-red-400 hover:underline mr-4 flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
                                    <button onClick={() => handleOpenPayModal(customer)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Pagar</button>
                                    <button onClick={() => handleExportReport(customer)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm ml-2 flex items-center"><FileText size={14} className="mr-1"/>Exportar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Modal: Adicionar Cliente */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Cliente">
                <form onSubmit={handleAddCustomer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" placeholder="Nome do cliente" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Editar Cliente */}
            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Editar Cliente">
                <form onSubmit={handleUpdateCustomer} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" placeholder="Nome do cliente" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar alterações</button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Pagar Cliente */}
            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title={selectedCustomer ? `Registrar Pagamento - ${selectedCustomer.name}` : 'Registrar Pagamento'}>
                {selectedCustomer && (
                    <form onSubmit={handleAddPayment} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Valor</label>
                                <input type="number" step="0.01" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Método</label>
                                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as unknown as PaymentMethod)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
                                    <option value={PaymentMethod.Pix}>Pix</option>
                                    <option value={PaymentMethod.Cash}>À Vista</option>
                                    <option value={PaymentMethod.Check}>Cheque</option>
                                    <option value={PaymentMethod.Caixa}>Caixa</option>
                                    <option value={PaymentMethod.Expense}>Despesa</option>
                                </select>
                            </div>
                        </div>
                        <div className="border-t dark:border-gray-600 pt-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Alocação (fornecedores + caixa) deve somar o valor pago</p>
                            <div className="max-h-48 overflow-y-auto divide-y dark:divide-gray-700">
                                {suppliers.map(s => (
                                    <div key={s.id} className="flex items-center justify-between py-2">
                                        <span className="text-sm">{s.name}</span>
                                        <input type="number" step="0.01" min="0" placeholder="0,00" onChange={(e) => handleAllocationChange(s.id, e.target.value)} className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-right" />
                                    </div>
                                ))}
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm font-medium">Caixa</span>
                                    <input type="number" step="0.01" min="0" placeholder="0,00" value={cashAllocation} onChange={(e) => setCashAllocation(Number(e.target.value) || 0)} className="w-36 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-right" />
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Confirmar Pagamento</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal: Detalhes do Cliente */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedCustomer ? `Detalhes - ${selectedCustomer.name}` : 'Detalhes do Cliente'}>
                {selectedCustomer && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Saldo devedor</p>
                            <p className={`text-2xl font-semibold ${selectedCustomer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(selectedCustomer.balance)}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Vendas</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2">Produtos</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerSales.length === 0 && (<tr><td className="p-3 text-gray-500" colSpan={3}>Sem vendas</td></tr>)}
                                        {customerSales.slice().reverse().map(s => (
                                            <tr key={s.id} className="border-t dark:border-gray-700">
                                                <td className="p-2">{new Date(s.date).toLocaleString()}</td>
                                                <td className="p-2">
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {(s.products || []).map((p: any, idx: number) => (
                                                            <li key={idx}>{productMap.get(p.productId) || p.productName || 'Produto removido'} ({p.quantity}x {formatCurrency(p.unitPrice)})</li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td className="p-2 text-right">{formatCurrency(s.totalAmount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Pagamentos</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2">Método</th>
                                            <th className="p-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerPaymentsRows.length === 0 && (<tr><td className="p-3 text-gray-500" colSpan={3}>Sem pagamentos</td></tr>)}
                                        {customerPaymentsRows.map(row => (
                                            <tr key={row.id} className="border-t dark:border-gray-700">
                                                <td className="p-2">{new Date(row.date).toLocaleString()}</td>
                                                <td className="p-2">{String(row.method || '-')}</td>
                                                <td className="p-2 text-right">{formatCurrency(row.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Customers;
