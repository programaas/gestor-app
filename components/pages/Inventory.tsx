
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Product } from '../../types';
import Modal from '../ui/Modal';
import { Package, Edit, Trash2 } from 'lucide-react';

const Inventory: React.FC = () => {
    const { products, updateProduct, deleteProduct } = useAppContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [newName, setNewName] = useState<string>('');
    const [newCostPrice, setNewCostPrice] = useState<number>(0);
    const [newQuantity, setNewQuantity] = useState<number>(0);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setNewName(product.name);
        setNewCostPrice(product.averageCost);
        setNewQuantity(product.quantity);
        setIsEditModalOpen(true);
    };

    const handleUpdateProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct && newName.trim() && newCostPrice >= 0 && newQuantity >= 0) {
            updateProduct(editingProduct.id, newName.trim(), newCostPrice, newQuantity);
            setIsEditModalOpen(false);
            setEditingProduct(null);
            setNewName('');
            setNewCostPrice(0);
            setNewQuantity(0);
        }
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            deleteProduct(productId);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Estoque de Produtos</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Quantidade</th>
                            <th className="p-4 font-semibold">Custo Médio</th>
                            <th className="p-4 font-semibold">Valor Total em Estoque</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Package size={16} className="mr-2 text-gray-500" />{product.name}</td>
                                <td className="p-4">{product.quantity}</td>
                                <td className="p-4">{formatCurrency(product.averageCost)}</td>
                                <td className="p-4">{formatCurrency(product.quantity * product.averageCost)}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenEditModal(product)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 dark:text-red-400 hover:underline flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Product Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar Produto: ${editingProduct?.name}`}>
                <form onSubmit={handleUpdateProduct}>
                    <div className="mb-4">
                        <label htmlFor="edit-product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Produto</label>
                        <input type="text" id="edit-product-name" value={newName} onChange={e => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="edit-cost-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Preço de Custo Médio</label>
                        <input type="number" id="edit-cost-price" value={newCostPrice} onChange={e => setNewCostPrice(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" step="0.01" min="0" required />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="edit-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantidade</label>
                        <input type="number" id="edit-quantity" value={newQuantity} onChange={e => setNewQuantity(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" min="0" required />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Atualizar</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
