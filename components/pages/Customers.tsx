
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Customer, PaymentMethod, Sale } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, User, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Customers: React.FC = () => {
    const { customers, addCustomer, updateCustomer, deleteCustomer, addCustomerPayment, suppliers, sales, products } = useAppContext();
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
            const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
            if(Math.abs(totalAllocated - paymentAmount) > 0.01) {
                alert('O valor alocado aos fornecedores deve ser igual ao valor do pagamento.');
                return;
            }
            addCustomerPayment(selectedCustomer.id, paymentAmount, paymentMethod, allocations);
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
    
    const customerSales = (sales || []).filter(s => s.customerId === selectedCustomer?.id);

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
                        {(customers || []).map(customer => (
                            <tr key={customer.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><User size={16} className="mr-2 text-gray-500" />{customer.name}</td>
                                <td className={`p-4 font-medium ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(customer.balance)}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenDetailModal(customer)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4">Detalhes</button>
                                    <button onClick={() => handleOpenEditModal(customer)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                    <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 dark:text-red-400 hover:underline mr-4 flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
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

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Editar Cliente: ${editingCustomer?.name}`}>
                <form onSubmit={handleUpdateCustomer}>
                    <div className="mb-4">
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Cliente</label>
                        <input type="text" id="edit-name" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Atualizar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title={`Registrar Pagamento de ${selectedCustomer?.name}`}>
                 <form onSubmit={handleAddPayment}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium">Valor do Pagamento</label>
                        <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" required />
                    </div>
                     <div className="mb-4">
                        <label className="block text-sm font-medium">Forma de Pagamento</label>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <h4 className="text-md font-medium mb-2">Alocar pagamento para fornecedores (Opcional)</h4>
                        {(suppliers || []).map(supplier => (
                            <div key={supplier.id} className="flex items-center justify-between mb-2">
                                <label>{supplier.name}</label>
                                <input type="number" placeholder="0.00" onChange={e => handleAllocationChange(supplier.id, e.target.value)} className="w-32 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Confirmar Pagamento</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Detalhes de ${selectedCustomer?.name}`}>
                <div className="space-y-4">
                    <p><strong>Saldo Devedor:</strong> <span className="font-bold text-red-500">{formatCurrency(selectedCustomer?.balance || 0)}</span></p>
                    <h4 className="font-semibold mt-4 border-t pt-4">Histórico de Vendas</h4>
                     <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                <tr className="text-left">
                                    <th className="p-2">Data</th>
                                    <th className="p-2">Produtos</th>
                                    <th className="p-2 text-right">Valor Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customerSales.map(sale => (
                                    <tr key={sale.id} className="border-b dark:border-gray-600">
                                        <td className="p-2 align-top">{new Date(sale.date).toLocaleDateString()}</td>
                                        <td className="p-2">
                                            <ul className="list-disc list-inside">
                                            {(sale.products || []).map(p => {
                                                const product = (products || []).find(prod => prod.id === p.productId);
                                                return <li key={p.productId}>{product?.name} ({p.quantity}x {formatCurrency(p.unitPrice)})</li>
                                            })}
                                            </ul>
                                        </td>
                                        <td className="p-2 align-top text-right">{formatCurrency(sale.totalAmount)}</td>
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
