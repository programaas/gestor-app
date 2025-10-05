
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Supplier } from '../../types'; 
import Modal from '../ui/Modal';
import { PlusCircle, Truck, Edit, Trash2, FileText, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters'; // Caminho corrigido
import { generateSupplierReport } from '../../utils/reportGenerator';

const Suppliers: React.FC = () => {
    const { suppliers, purchases, customerPayments, products, addSupplier, updateSupplier, deleteSupplier } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [newName, setNewName] = useState('');

    const handleExportReport = (supplier: Supplier) => {
        generateSupplierReport(supplier, purchases, customerPayments, products);
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
        if (window.confirm('Tem certeza que deseja excluir este fornecedor? A exclusão removerá o fornecedor de todas as compras associadas, o que pode impactar relatórios históricos.')) {
            deleteSupplier(supplierId);
        }
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
                            <th className="p-4 font-semibold">Saldo a Pagar</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(supplier => (
                            <tr key={supplier.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Truck size={16} className="mr-2 text-gray-500" />{supplier.name}</td>
                                <td className={`p-4 font-medium ${supplier.balance > 0 ? 'text-orange-500' : 'text-green-500'}`}>{formatCurrency(supplier.balance)}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenEditModal(supplier)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4"><Edit size={16} /> Editar</button>
                                    <button onClick={() => handleDeleteSupplier(supplier.id)} className="text-red-600 dark:text-red-400 hover:underline mr-4"><Trash2 size={16} /> Excluir</button>
                                    <button onClick={() => handleExportReport(supplier)} className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center"><FileText size={14} className="mr-1"/>Exportar</button>
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

export default Suppliers;
