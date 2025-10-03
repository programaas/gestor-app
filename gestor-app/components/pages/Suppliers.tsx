import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Supplier, PaymentMethod } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, Truck } from 'lucide-react';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier, addSupplierPayment, purchases, supplierPayments, products } = useAppContext();
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isPayModalOpen, setPayModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    
    const [newName, setNewName] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Pix);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addSupplier(newName.trim());
            setNewName('');
            setAddModalOpen(false);
        }
    };

    const handleOpenPayModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setPaymentAmount(supplier.balance > 0 ? supplier.balance : 0);
        setPayModalOpen(true);
    };
    
    const handleOpenDetailModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setDetailModalOpen(true);
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedSupplier && paymentAmount > 0) {
            addSupplierPayment(selectedSupplier.id, paymentAmount, paymentMethod);
            setPayModalOpen(false);
        }
    };
    
    const supplierPurchases = purchases.filter(p => p.supplierId === selectedSupplier?.id);
    const supplierPaymentHistory = supplierPayments.filter(p => p.supplierId === selectedSupplier?.id);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Fornecedores</h1>
                <button onClick={() => setAddModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Adicionar Fornecedor
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold">Saldo a Pagar</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(supplier => (
                            <tr key={supplier.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Truck size={16} className="mr-2 text-gray-500" />{supplier.name}</td>
                                <td className={`p-4 font-medium ${supplier.balance > 0 ? 'text-orange-500' : 'text-green-500'}`}>{formatCurrency(supplier.balance)}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleOpenDetailModal(supplier)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4">Detalhes</button>
                                    <button onClick={() => handleOpenPayModal(supplier)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm" disabled={supplier.balance <= 0}>Pagar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Adicionar Novo Fornecedor">
                <form onSubmit={handleAddSupplier}>
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Fornecedor</label>
                        <input type="text" id="name" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Salvar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPayModalOpen} onClose={() => setPayModalOpen(false)} title={`Registrar Pagamento para ${selectedSupplier?.name}`}>
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
                    <div className="flex justify-end">
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Confirmar Pagamento</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title={`Detalhes de ${selectedSupplier?.name}`}>
                <div className="space-y-4">
                    <p><strong>Saldo a Pagar:</strong> <span className="font-bold text-orange-500">{formatCurrency(selectedSupplier?.balance || 0)}</span></p>
                    
                    <h4 className="font-semibold mt-4 border-t pt-4">Histórico de Compras</h4>
                     <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                <tr className="text-left">
                                    <th className="p-2">Data</th><th className="p-2">Produto</th><th className="p-2">Qtd.</th><th className="p-2">Valor Unit.</th><th className="p-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierPurchases.slice().reverse().map(purchase => {
                                    const product = products.find(p => p.id === purchase.productId);
                                    return (
                                        <tr key={purchase.id} className="border-b dark:border-gray-600">
                                            <td className="p-2">{new Date(purchase.date).toLocaleDateString()}</td>
                                            <td className="p-2">{product?.name || 'N/A'}</td>
                                            <td className="p-2">{purchase.quantity}</td>
                                            <td className="p-2">{formatCurrency(purchase.unitPrice)}</td>
                                            <td className="p-2">{formatCurrency(purchase.quantity * purchase.unitPrice)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <h4 className="font-semibold mt-4 border-t pt-4">Histórico de Pagamentos</h4>
                     <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-100 dark:bg-gray-700">
                                <tr className="text-left">
                                    <th className="p-2">Data</th><th className="p-2">Valor</th><th className="p-2">Método</th><th className="p-2">Origem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {supplierPaymentHistory.slice().reverse().map(payment => (
                                    <tr key={payment.id} className="border-b dark:border-gray-600">
                                        <td className="p-2">{new Date(payment.date).toLocaleDateString()}</td>
                                        <td className="p-2 text-green-500">{formatCurrency(payment.amount)}</td>
                                        <td className="p-2">{payment.method}</td>
                                        <td className="p-2">{payment.origin === 'direct' ? 'Direto' : 'Via Cliente'}</td>
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

export default Suppliers;
