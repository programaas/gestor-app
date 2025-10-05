
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Supplier, Purchase } from '../../types'; 
import Modal from '../ui/Modal';
import { PlusCircle, Truck, Edit, Trash2, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const Suppliers: React.FC = () => {
    const { suppliers, purchases, addSupplier, updateSupplier, deleteSupplier } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);
    const [viewingPaymentsOf, setViewingPaymentsOf] = useState<Supplier | null>(null);

    const [newName, setNewName] = useState('');

    const getSupplierBalance = (supplierId: string) => {
        const totalPurchases = purchases
            .filter(p => p.supplierId === supplierId)
            .reduce((acc, p) => acc + (p.quantity * p.unitPrice), 0);
        // Assuming payments to suppliers are not yet tracked, this will be the balance.
        // This can be updated once supplier payments are implemented.
        return totalPurchases;
    };

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addSupplier(newName.trim());
            setNewName('');
            setIsAddModalOpen(false);
        }
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setNewName(supplier.name); 
        setIsEditModalOpen(true);
    };

    const handleUpdateSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier && newName.trim()) {
            updateSupplier(editingSupplier.id, newName.trim());
            setIsEditModalOpen(false);
            setEditingSupplier(null);
            setNewName('');
        }
    };

    const handleDeleteSupplier = (supplierId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
            deleteSupplier(supplierId);
        }
    };
    
    const handleOpenPaymentsModal = (supplier: Supplier) => {
        setViewingPaymentsOf(supplier);
        setIsPaymentsModalOpen(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Fornecedores</h1>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Adicionar Fornecedor
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                            <th className="p-4 font-semibold text-right">Saldo Devedor</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(supplier => (
                            <tr key={supplier.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Truck size={16} className="mr-2 text-gray-500" />{supplier.name}</td>
                                <td className="p-4 text-right">{formatCurrency(getSupplierBalance(supplier.id))}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenPaymentsModal(supplier)} className="text-green-600 dark:text-green-400 hover:underline mr-4 flex items-center"><DollarSign size={16} className="mr-1"/> Pagamentos</button>
                                    <button onClick={() => handleOpenEditModal(supplier)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                    <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600 dark:text-red-400 hover:underline flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Novo Fornecedor">
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

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Fornecedor: ${editingSupplier?.name}`}>
                <form onSubmit={handleUpdateSupplier}>
                    <div className="mb-4">
                        <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Fornecedor</label>
                        <input type="text" id="edit-name" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Atualizar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPaymentsModalOpen} onClose={() => setIsPaymentsModalOpen(false)} title={`Histórico de Pagamentos: ${viewingPaymentsOf?.name}`}>
                <div>
                    {/* Payment history will be displayed here. Implementation will follow in the next steps. */}
                    <p>Histórico de pagamentos para {viewingPaymentsOf?.name}.</p>
                </div>
            </Modal>
        </div>
    );
};

export default Suppliers;
