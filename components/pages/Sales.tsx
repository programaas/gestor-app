
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Sale } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, ShoppingCart, Edit, Trash2 } from 'lucide-react';

const Sales: React.FC = () => {
    const { products, customers, addSale, updateSale, deleteSale, sales } = useAppContext();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);

    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);

    const resetForm = () => {
        setSelectedProduct('');
        setSelectedCustomer('');
        setQuantity(1);
        setUnitPrice(0);
    };

    const handleAddSale = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !selectedCustomer || quantity <= 0 || unitPrice < 0) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        addSale(selectedProduct, selectedCustomer, quantity, unitPrice);
        setIsAddModalOpen(false);
        resetForm();
    };
    
    const handleOpenEditModal = (sale: Sale) => {
        setEditingSale(sale);
        setSelectedProduct(sale.productId);
        setSelectedCustomer(sale.customerId);
        setQuantity(sale.quantity);
        setUnitPrice(sale.unitPrice);
        setIsEditModalOpen(true);
    };

    const handleUpdateSale = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSale && selectedProduct && selectedCustomer && quantity > 0 && unitPrice >= 0) {
            updateSale(editingSale.id, selectedProduct, selectedCustomer, quantity, unitPrice);
            setIsEditModalOpen(false);
            setEditingSale(null);
            resetForm();
        }
    };

    const handleDeleteSale = (saleId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
            deleteSale(saleId);
        }
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vendas</h1>
                <button onClick={() => { setIsAddModalOpen(true); resetForm(); }} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Venda
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                     <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Cliente</th>
                            <th className="p-4 font-semibold">Qtd.</th>
                            <th className="p-4 font-semibold">Preço Unit.</th>
                            <th className="p-4 font-semibold">Total</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.slice().reverse().map(sale => {
                             const product = products.find(p => p.id === sale.productId);
                             const customer = customers.find(c => c.id === sale.customerId);
                             return(
                                <tr key={sale.id} className="border-b dark:border-gray-700">
                                    <td className="p-4">{new Date(sale.date).toLocaleString()}</td>
                                    <td className="p-4 flex items-center"><ShoppingCart size={16} className="mr-2 text-gray-500" />{product?.name || 'N/A'}</td>
                                    <td className="p-4">{customer?.name || 'N/A'}</td>
                                    <td className="p-4">{sale.quantity}</td>
                                    <td className="p-4">{formatCurrency(sale.unitPrice)}</td>
                                    <td className="p-4">{formatCurrency(sale.quantity * sale.unitPrice)}</td>
                                    <td className="p-4 text-right flex items-center justify-end">
                                        <button onClick={() => handleOpenEditModal(sale)} className="text-blue-600 dark:text-blue-400 hover:underline mr-4 flex items-center"><Edit size={16} className="mr-1" /> Editar</button>
                                        <button onClick={() => handleDeleteSale(sale.id)} className="text-red-600 dark:text-red-400 hover:underline flex items-center"><Trash2 size={16} className="mr-1" /> Excluir</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetForm(); }} title="Registrar Nova Venda">
                <form onSubmit={handleAddSale} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Produto</label>
                        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um produto</option>
                            {products.filter(p=>p.quantity > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Cliente</label>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um cliente</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Quantidade</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" min="1" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Preço de Venda (Unitário)</label>
                            <input type="number" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" required />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Registrar Venda</button>
                    </div>
                </form>
            </Modal>

            {/* Edit Sale Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingSale(null); resetForm(); }} title={`Editar Venda: ${editingSale?.id}`}>
                <form onSubmit={handleUpdateSale} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Produto</label>
                        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um produto</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Cliente</label>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um cliente</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Quantidade</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" min="1" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Preço de Venda (Unitário)</label>
                            <input type="number" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" required />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Atualizar Venda</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Sales;
