
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { PlusCircle, Package, Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface PurchaseFormState {
    id?: string; // Optional for new purchases, required for editing
    selectedProduct: string;
    newProductName: string;
    isNewProduct: boolean;
    selectedSupplier: string;
    quantity: number;
    unitPrice: number;
}

const Purchases: React.FC = () => {
    const { products, suppliers, addPurchase, purchases, updatePurchase, deletePurchase } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPurchase, setEditingPurchase] = useState<PurchaseFormState | null>(null);

    const [formState, setFormState] = useState<PurchaseFormState>({
        selectedProduct: '',
        newProductName: '',
        isNewProduct: false,
        selectedSupplier: '',
        quantity: 1,
        unitPrice: 0,
    });

    useEffect(() => {
        if (editingPurchase) {
            setFormState(editingPurchase);
        } else {
            setFormState({
                selectedProduct: '',
                newProductName: '',
                isNewProduct: false,
                selectedSupplier: '',
                quantity: 1,
                unitPrice: 0,
            });
        }
    }, [editingPurchase]);

    const resetForm = () => {
        setEditingPurchase(null);
        setIsModalOpen(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormState(prevState => ({ ...prevState, [name]: (e.target as HTMLInputElement).checked }));
        } else if (type === 'number') {
            setFormState(prevState => ({ ...prevState, [name]: parseFloat(value) }));
        } else {
            setFormState(prevState => ({ ...prevState, [name]: value }));
        }
    };

    const handleAddOrUpdatePurchase = (e: React.FormEvent) => {
        e.preventDefault();
        const { id, selectedProduct, newProductName, isNewProduct, selectedSupplier, quantity, unitPrice } = formState;

        if ((!isNewProduct && !selectedProduct) || !selectedSupplier || quantity <= 0 || unitPrice < 0) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        if (editingPurchase) {
            updatePurchase(id!, isNewProduct ? newProductName : selectedProduct, selectedSupplier, quantity, unitPrice);
        } else {
            addPurchase(isNewProduct ? { name: newProductName } : selectedProduct, selectedSupplier, quantity, unitPrice);
        }
        resetForm();
    };

    const onEdit = (purchaseId: string) => {
        const purchaseToEdit = purchases.find(p => p.id === purchaseId);
        if (purchaseToEdit) {
            setEditingPurchase({
                id: purchaseToEdit.id,
                selectedProduct: purchaseToEdit.productId,
                newProductName: products.find(p => p.id === purchaseToEdit.productId)?.name || '', // Pre-fill if product exists
                isNewProduct: false,
                selectedSupplier: purchaseToEdit.supplierId,
                quantity: purchaseToEdit.quantity,
                unitPrice: purchaseToEdit.unitPrice,
            });
            setIsModalOpen(true);
        }
    };

    const onDelete = (purchaseId: string) => {
        if (window.confirm("Tem certeza que deseja deletar esta compra?")) {
            deletePurchase(purchaseId);
        }
    };

    const getRecipientName = (supplierId: string) => {
        if (supplierId === '_CAIXA_') return 'Caixa (Transferência Interna)';
        if (supplierId === '_DESPESAS_') return 'Despesas Gerais';
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier?.name || 'N/A';
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Lançamentos</h1>
                <button onClick={() => { setEditingPurchase(null); setIsModalOpen(true); }} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow">
                    <PlusCircle size={20} className="mr-2" />
                    Novo Lançamento
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Data</th>
                            <th className="p-4 font-semibold">Produto/Descrição</th>
                            <th className="p-4 font-semibold">Destinatário</th>
                            <th className="p-4 font-semibold">Qtd.</th>
                            <th className="p-4 font-semibold">Preço Unit.</th>
                            <th className="p-4 font-semibold">Total</th>
                            <th className="p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchases.slice().reverse().map(purchase => {
                             const product = products.find(p => p.id === purchase.productId);
                             return(
                                <tr key={purchase.id} className="border-b dark:border-gray-700">
                                    <td className="p-4">{new Date(purchase.date).toLocaleString()}</td>
                                    <td className="p-4 flex items-center"><Package size={16} className="mr-2 text-gray-500" />{product?.name || 'N/A'}</td>
                                    <td className="p-4">{getRecipientName(purchase.supplierId)}</td>
                                    <td className="p-4">{purchase.quantity}</td>
                                    <td className="p-4">{formatCurrency(purchase.unitPrice)}</td>
                                    <td className="p-4">{formatCurrency(purchase.quantity * purchase.unitPrice)}</td>
                                    <td className="p-4">
                                        <button onClick={() => onEdit(purchase.id)} className="text-blue-600 hover:text-blue-800 mr-2">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => onDelete(purchase.id)} className="text-red-600 hover:text-red-800">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title={editingPurchase ? "Editar Lançamento" : "Registrar Novo Lançamento"}>
                <form onSubmit={handleAddOrUpdatePurchase} className="space-y-4">
                     <div>
                        <label className="flex items-center">
                            <input type="checkbox" name="isNewProduct" checked={formState.isNewProduct} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
                            <span className="ml-2 text-sm">Cadastrar novo produto/despesa</span>
                        </label>
                    </div>
                    {formState.isNewProduct ? (
                        <div>
                            <label className="block text-sm font-medium">Nome do Novo Produto/Despesa</label>
                            <input type="text" name="newProductName" value={formState.newProductName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required={formState.isNewProduct} />
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium">Produto/Serviço</label>
                            <select name="selectedProduct" value={formState.selectedProduct} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required={!formState.isNewProduct}>
                                <option value="">Selecione um item</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                        <label className="block text-sm font-medium">Destinatário</label>
                        <select name="selectedSupplier" value={formState.selectedSupplier} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" required>
                            <option value="">Selecione o destinatário</option>
                            <option value="_CAIXA_">Caixa (Transferência Interna)</option>
                            <option value="_DESPESAS_">Despesas Gerais</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Quantidade</label>
                            <input type="number" name="quantity" value={formState.quantity} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" min="1" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Valor (Unitário)</label>
                            <input type="number" name="unitPrice" value={formState.unitPrice} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" required />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">{editingPurchase ? "Salvar Alterações" : "Adicionar Lançamento"}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Purchases;
