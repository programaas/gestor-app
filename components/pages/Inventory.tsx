
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters'; // Caminho corrigido

const Inventory: React.FC = () => {
    const { products, updateProduct, deleteProduct, isLoading } = useAppContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [productForm, setProductForm] = useState({ name: '', category: '', quantity: 0, averageCost: 0 });

    const handleOpenEditModal = (product: any) => {
        setEditingProduct(product);
        setProductForm(product);
        setIsEditModalOpen(true);
    };

    const handleUpdateProduct = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingProduct) {
            updateProduct(
                editingProduct.id,
                productForm.name,
                productForm.averageCost,
                productForm.quantity,
                productForm.category
            ).then(() => {
                setIsEditModalOpen(false);
                setEditingProduct(null);
            }).catch(error => {
                console.error("Failed to update product:", error);
                alert("Erro ao atualizar o produto. Verifique o console para mais detalhes.");
            });
        }
    };

    const handleDeleteProduct = (productId: string) => {
        if (window.confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
            deleteProduct(productId).catch(error => {
                console.error("Failed to delete product:", error);
                alert('Erro ao excluir o produto. Verifique o console para mais detalhes.');
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProductForm(prev => ({ ...prev, [name]: name === 'quantity' || name === 'averageCost' ? Number(value) : value }));
    };

    if (isLoading) {
        return <div>Carregando...</div>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Gestão de Estoque</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Categoria</th>
                            <th className="p-4 font-semibold text-right">Quantidade</th>
                            <th className="p-4 font-semibold text-right">Custo Médio</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b dark:border-gray-700">
                                <td className="p-4">{product.name}</td>
                                <td className="p-4">{product.category}</td>
                                <td className="p-4 text-right">{product.quantity}</td>
                                <td className="p-4 text-right">{formatCurrency(product.averageCost)}</td>
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={() => handleOpenEditModal(product)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 dark:text-red-400 hover:underline flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Produto">
                <form onSubmit={handleUpdateProduct}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Nome do Produto</label>
                            <input type="text" name="name" value={productForm.name} onChange={handleChange} className="mt-1 block w-full input-style" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Categoria</label>
                            <input type="text" name="category" value={productForm.category} onChange={handleChange} className="mt-1 block w-full input-style" />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Quantidade</label>
                            <input type="number" name="quantity" value={productForm.quantity} onChange={handleChange} className="mt-1 block w-full input-style" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium">Custo Médio</label>
                            <input type="number" step="0.01" name="averageCost" value={productForm.averageCost} onChange={handleChange} className="mt-1 block w-full input-style" required />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Salvar Alterações</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Inventory;
