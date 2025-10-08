
import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Modal from '../ui/Modal';
import { Edit, Trash2, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters'; // Caminho corrigido

const Inventory: React.FC = () => {
    const { products, updateProduct, deleteProduct, isLoading } = useAppContext();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [productForm, setProductForm] = useState({ name: '', category: '', quantity: 0, averageCost: 0 });
    const anyCtx = useAppContext() as any;
    const purchases = anyCtx.purchases || [];
    const sales = anyCtx.sales || [];
    const suppliers = anyCtx.suppliers || [];
    const customers = anyCtx.customers || [];
    const [isTxnOpen, setTxnOpen] = useState(false);
    const [txnProductId, setTxnProductId] = useState<string>('');

    const handleOpenEditModal = (product: any) => {
        setEditingProduct(product);
        setProductForm(product);
        setIsEditModalOpen(true);
    };
    const openTransactions = (productId: string) => { setTxnProductId(productId); setTxnOpen(true); };

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
                                    <button onClick={() => openTransactions(product.id)} className="text-indigo-600 dark:text-indigo-400 hover:underline mr-4 flex items-center"><FileText size={16} className="mr-1" /> Transações</button>
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
            <Modal isOpen={isTxnOpen} onClose={() => setTxnOpen(false)} title="Transações do Produto">
                {txnProductId && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2">Compras</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr><th className="p-2">Data</th><th className="p-2">Fornecedor</th><th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Preço</th><th className="p-2 text-right">Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {purchases.filter((p: any) => p.productId === txnProductId).slice().reverse().map((p: any) => {
                                            const sup = suppliers.find((s: any) => s.id === p.supplierId);
                                            return (
                                                <tr key={p.id} className="border-t dark:border-gray-700">
                                                    <td className="p-2">{new Date(p.date).toLocaleString()}</td>
                                                    <td className="p-2">{sup?.name || '-'}</td>
                                                    <td className="p-2 text-right">{p.quantity}</td>
                                                    <td className="p-2 text-right">{formatCurrency(p.unitPrice)}</td>
                                                    <td className="p-2 text-right">{formatCurrency((p.quantity || 0) * (p.unitPrice || 0))}</td>
                                                </tr>
                                            );
                                        })}
                                        {purchases.filter((p: any) => p.productId === txnProductId).length === 0 && (
                                            <tr><td className="p-3 text-gray-500" colSpan={5}>Sem compras</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Vendas</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr><th className="p-2">Data</th><th className="p-2">Cliente</th><th className="p-2 text-right">Qtd</th><th className="p-2 text-right">Preço</th><th className="p-2 text-right">Total</th></tr>
                                    </thead>
                                    <tbody>
                                        {sales.flatMap((s: any) => (s.products || []).map((it: any) => ({ sale: s, it }))).filter((x: any) => x.it.productId === txnProductId).slice().reverse().map((x: any, idx: number) => {
                                            const cust = customers.find((c: any) => c.id === x.sale.customerId);
                                            return (
                                                <tr key={idx} className="border-t dark:border-gray-700">
                                                    <td className="p-2">{new Date(x.sale.date).toLocaleString()}</td>
                                                    <td className="p-2">{cust?.name || '-'}</td>
                                                    <td className="p-2 text-right">{x.it.quantity}</td>
                                                    <td className="p-2 text-right">{formatCurrency(x.it.unitPrice)}</td>
                                                    <td className="p-2 text-right">{formatCurrency((x.it.quantity || 0) * (x.it.unitPrice || 0))}</td>
                                                </tr>
                                            );
                                        })}
                                        {sales.flatMap((s: any) => (s.products || []).map((it: any) => ({ sale: s, it }))).filter((x: any) => x.it.productId === txnProductId).length === 0 && (
                                            <tr><td className="p-3 text-gray-500" colSpan={5}>Sem vendas</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Inventory;
