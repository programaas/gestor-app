
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { PlusCircle, Truck } from 'lucide-react';

const Suppliers: React.FC = () => {
    const { suppliers, addSupplier } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (newName.trim()) {
            addSupplier(newName.trim());
            setNewName('');
            setIsModalOpen(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Fornecedores</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Adicionar Fornecedor
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Nome</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map(supplier => (
                            <tr key={supplier.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Truck size={16} className="mr-2 text-gray-500" />{supplier.name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Novo Fornecedor">
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
        </div>
    );
};

export default Suppliers;
