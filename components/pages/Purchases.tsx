import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import Modal from '../ui/Modal.tsx';
import { PlusCircle, Package, Edit } from 'lucide-react';
import { Purchase } from '../../types.ts';

const Purchases: React.FC = () => {
    const { products, suppliers, addPurchase, updatePurchase, purchases } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

    const [selectedProduct, setSelectedProduct] = useState<string>('');
    const [newProductName, setNewProductName] = useState('');
    const [isNewProduct, setIsNewProduct] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);

    useEffect(() => {
        if (editingPurchase) {
            setSelectedProduct(editingPurchase.productId);
            setSelectedSupplier(editingPurchase.supplierId);
            setQuantity(editingPurchase.quantity);
            setUnitPrice(editingPurchase.unitPrice);
            setIsNewProduct(false); // Can't edit to a new product
        }
    }, [editingPurchase]);


    const resetForm = () => {
        setSelectedProduct('');
        setNewProductName('');
        setIsNewProduct(false);
        setSelectedSupplier('');
        setQuantity(1);
        setUnitPrice(0);
        setIsModalOpen(false);
        setEditingPurchase(null);
    };
    
    const handleOpenEditModal = (purchase: Purchase) => {
        setEditingPurchase(purchase);
        setIsModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!isNewProduct && !selectedProduct) || !selectedSupplier || quantity <= 0 || unitPrice < 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        if (editingPurchase) {
            updatePurchase(editingPurchase.id, {
                productId: selectedProduct,
                supplierId: selectedSupplier,
                quantity,
                unitPrice
            });
        } else {
            const productIdentifier = isNewProduct ? { name: newProductName } : selectedProduct;
            addPurchase(productIdentifier, selectedSupplier, quantity, unitPrice);
        }
        resetForm();
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Compras</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Compra
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Fornecedor</th>
                            <th className="p-4 font-semibold">Qtd.</th>
                            <th className="p-4 font-semibold">Preço Unit.</th>
                            <th className="p-4 font-semibold">Total</th>
                            <th className="p-4 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.slice().reverse().map(purchase => {
                             const product = products.find(p => p.id === purchase.productId);
                             const supplier = suppliers.find(s => s.id === purchase.supplierId);
                             return(
                                <tr key={purchase.id} className="border-b dark:border-gray-700">
                                    <td className="p-4">{new Date(purchase.date).toLocaleString()}</td>
                                    <td className="p-4 flex items-center"><Package size={16} className="mr-2 text-gray-500" />{product?.name || 'N/A'}</td>
                                    <td className="p-4">{supplier?.name || 'N/A'}</td>
                                    <td className="p-4">{purchase.quantity}</td>
                                    <td className="p-4">{formatCurrency(purchase.unitPrice)}</td>
                                    <td className="p-4">{formatCurrency(purchase.quantity * purchase.unitPrice)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleOpenEditModal(purchase)} className="text-indigo-600 dark:text-indigo-400 hover:underline p-1">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title={editingPurchase ? "Editar Compra" : "Registrar Nova Compra"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="flex items-center">
                            <input type="checkbox" checked={isNewProduct} onChange={e => setIsNewProduct(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" disabled={!!editingPurchase} />
                            <span className="ml-2 text-sm">Cadastrar novo produto</span>
                        </label>
                    </div>
                    {isNewProduct ? (
                        <div>
                            <label className="block text-sm font-medium">Nome do Novo Produto</label>
                            <input type="text" value={newProductName} onChange={e => setNewProductName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required={isNewProduct} />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium">Produto</label>
                            <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required={!isNewProduct}>
                                <option value="">Selecione um produto</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium">Fornecedor</label>
                        <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione um fornecedor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Quantidade</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" min="1" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Preço de Compra (Unitário)</label>
                            <input type="number" value={unitPrice} onChange={e => setUnitPrice(parseFloat(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" required />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">{editingPurchase ? 'Salvar Alterações' : 'Adicionar Compra'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Purchases;