
import React, { useState } from 'react';
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
                                    <button onClick={() => handleExportReport(customer)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm ml-2 flex items-center"><FileText size={14} className="mr-1"/>Exportar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
        </div>
    );
};

export default Customers;
