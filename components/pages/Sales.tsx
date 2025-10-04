
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { PlusCircle, ShoppingCart } from 'lucide-react';

const Sales: React.FC = () => {
    const { products, customers, addSale, sales } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [selectedCustomer, setSelectedCustomer] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);

    const resetForm = () => {
        setSelectedProduct('');
        setSelectedCustomer('');
        setQuantity(1);
        setUnitPrice(0);
        setIsModalOpen(false);
    };

    const handleAddSale = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !selectedCustomer || quantity <= 0 || unitPrice < 0) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        addSale(selectedProduct, selectedCustomer, quantity, unitPrice);
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
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Cliente</th>
                            <th className="p-4 font-semibold">Qtd.</th>
                            <th className="p-4 font-semibold">Preço Unit.</th>
                            <th className="p-4 font-semibold">Total</th>
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
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title="Registrar Nova Venda">
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
        </div>
    );
};

export default Sales;
