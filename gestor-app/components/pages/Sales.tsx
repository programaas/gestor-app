import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { PlusCircle, ShoppingCart, Trash2, Edit } from 'lucide-react';
import { SaleItem, Sale } from '../../types';

const Sales: React.FC = () => {
    const { products, customers, suppliers, addSale, updateSale, sales } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);

    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    
    const initialItemState = {
        productId: '',
        quantity: 1,
        unitPrice: 0,
        supplierId: '',
        costPrice: 0
    };
    const [currentItem, setCurrentItem] = useState<Omit<SaleItem, 'productId' | 'supplierId'> & {productId: string, supplierId: string}>(initialItemState);

    useEffect(() => {
        if (editingSale) {
            setSelectedCustomer(editingSale.customerId);
            setSaleItems(editingSale.items);
        }
    }, [editingSale]);


    const resetForm = () => {
        setSelectedCustomer('');
        setSaleItems([]);
        setCurrentItem(initialItemState);
        setIsModalOpen(false);
        setEditingSale(null);
    };

    const handleAddItem = () => {
        if (!currentItem.productId || !currentItem.supplierId || currentItem.quantity <= 0 || currentItem.unitPrice < 0 || currentItem.costPrice < 0) {
            alert('Por favor, preencha todos os campos do item.');
            return;
        }
        setSaleItems(prev => [...prev, currentItem]);
        setCurrentItem(initialItemState); // Reset for next item
    };

    const handleRemoveItem = (index: number) => {
        setSaleItems(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleOpenEditModal = (sale: Sale) => {
        setEditingSale(sale);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || saleItems.length === 0) {
            alert('Selecione um cliente e adicione pelo menos um item à venda.');
            return;
        }
        
        if (editingSale) {
            updateSale(editingSale.id, { customerId: selectedCustomer, items: saleItems });
        } else {
            addSale(selectedCustomer, saleItems);
        }
        resetForm();
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vendas</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Venda
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                     <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Cliente</th>
                            <th className="p-4 font-semibold">Itens</th>
                            <th className="p-4 font-semibold text-right">Total da Venda</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.slice().reverse().map(sale => {
                             const customer = customers.find(c => c.id === sale.customerId);
                             return(
                                <tr key={sale.id} className="border-b dark:border-gray-700">
                                    <td className="p-4">{new Date(sale.date).toLocaleString()}</td>
                                    <td className="p-4">{customer?.name || 'N/A'}</td>
                                    <td className="p-4">{sale.items.length}</td>
                                    <td className="p-4 text-right font-medium">{formatCurrency(sale.totalAmount)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleOpenEditModal(sale)} className="text-indigo-600 dark:text-indigo-400 hover:underline p-1">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title={editingSale ? "Editar Venda" : "Registrar Nova Venda"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium">Cliente</label>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um cliente</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="border-t border-b dark:border-gray-600 py-4 space-y-3">
                        <h3 className="font-semibold">Adicionar Item</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <select value={currentItem.productId} onChange={e => setCurrentItem({...currentItem, productId: e.target.value})} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                <option value="">Selecione um produto</option>
                                {products.filter(p=>p.quantity > 0).map(p => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>)}
                            </select>
                             <select value={currentItem.supplierId} onChange={e => setCurrentItem({...currentItem, supplierId: e.target.value})} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                                <option value="">Fornecedor do item</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                         <div className="grid grid-cols-3 gap-4">
                            <input type="number" placeholder="Quantidade" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 1})} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" min="1" />
                            <input type="number" placeholder="Preço Custo" value={currentItem.costPrice} onChange={e => setCurrentItem({...currentItem, costPrice: parseFloat(e.target.value) || 0})} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" />
                            <input type="number" placeholder="Preço Venda" value={currentItem.unitPrice} onChange={e => setCurrentItem({...currentItem, unitPrice: parseFloat(e.target.value) || 0})} className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" />
                        </div>
                        <div className="text-right">
                           <button type="button" onClick={handleAddItem} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm">Adicionar Item</button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {saleItems.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                                <div key={index} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-sm">
                                    <span>{item.quantity}x {product?.name || '...'}</span>
                                    <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                    <button type="button" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                     <div className="text-right font-bold text-lg">
                        Total: {formatCurrency(saleItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">{editingSale ? 'Salvar Alterações' : 'Registrar Venda'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Sales;