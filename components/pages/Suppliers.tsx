
import React, { useMemo, useState } from 'react';
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

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const remainingBySupplier = useMemo(() => {
        const map = new Map<string, number>();
        (purchases || []).forEach(p => {
            const total = p.quantity * p.unitPrice;
            map.set(p.supplierId, (map.get(p.supplierId) || 0) + total);
        });
        (customerPayments || []).forEach(cp => {
            (cp.allocatedTo || []).forEach(alloc => {
                map.set(alloc.supplierId, (map.get(alloc.supplierId) || 0) - alloc.amount);
            });
        });
        return map;
    }, [purchases, customerPayments]);

    const supplierPurchases = useMemo(() => {
        if (!selectedSupplier) return [] as { id: string; date: string; productName: string; quantity: number; unitPrice: number; total: number }[];
        return (purchases || [])
            .filter(p => p.supplierId === selectedSupplier.id)
            .map(p => ({ id: p.id, date: p.date, productName: productMap.get(p.productId)?.name || 'Produto removido', quantity: p.quantity, unitPrice: p.unitPrice, total: p.quantity * p.unitPrice }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedSupplier, purchases, productMap]);

    const supplierRepases = useMemo(() => {
        if (!selectedSupplier) return [] as { id: string; date: string; amount: number; method?: any }[];
        const rows: { id: string; date: string; amount: number; method?: any }[] = [];
        (customerPayments || []).forEach(cp => {
            (cp.allocatedTo || []).forEach((alloc, idx) => {
                if (alloc.supplierId === selectedSupplier.id) rows.push({ id: cp.id + '-' + idx, date: cp.date, amount: alloc.amount, method: (cp as any).method });
            });
        });
        return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [selectedSupplier, customerPayments]);

    const openDetails = (s: Supplier) => { setSelectedSupplier(s); setIsDetailModalOpen(true); };

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
                            <tr key={supplier.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => openDetails(supplier)}>
                                <td className="p-4 flex items-center"><Truck size={16} className="mr-2 text-gray-500" />{supplier.name}</td>
                                {(() => { const remain = remainingBySupplier.get(supplier.id) || 0; return (
                                    <td className={`p-4 font-medium ${remain > 0 ? 'text-orange-500' : 'text-green-500'}`}>{formatCurrency(remain)}</td>
                                ); })()}
                                <td className="p-4 text-right flex items-center justify-end">
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(supplier); }} className="text-blue-600 dark:text-blue-400 hover:underline mr-4"><Edit size={16} /> Editar</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteSupplier(supplier.id); }} className="text-red-600 dark:text-red-400 hover:underline mr-4"><Trash2 size={16} /> Excluir</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleExportReport(supplier); }} className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm flex items-center"><FileText size={14} className="mr-1"/>Exportar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Fornecedor">
                <form onSubmit={handleAddSupplier} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Fornecedor">
                <form onSubmit={handleUpdateSupplier} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Nome</label>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700" required />
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Salvar alterações</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedSupplier ? `Movimentações - ${selectedSupplier.name}` : 'Movimentações'}>
                {selectedSupplier && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-700/40 p-4 rounded">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Restante a pagar</p>
                            {(() => { const remain = remainingBySupplier.get(selectedSupplier.id) || 0; return (
                                <p className={`text-2xl font-semibold ${remain > 0 ? 'text-orange-500' : 'text-green-500'}`}>{formatCurrency(remain)}</p>
                            ); })()}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Compras</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2">Produto</th>
                                            <th className="p-2 text-right">Qtd</th>
                                            <th className="p-2 text-right">Preço</th>
                                            <th className="p-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplierPurchases.length === 0 && (<tr><td className="p-3 text-gray-500" colSpan={5}>Sem compras</td></tr>)}
                                        {supplierPurchases.map(row => (
                                            <tr key={row.id} className="border-t dark:border-gray-700">
                                                <td className="p-2">{new Date(row.date).toLocaleString()}</td>
                                                <td className="p-2">{row.productName}</td>
                                                <td className="p-2 text-right">{row.quantity}</td>
                                                <td className="p-2 text-right">{formatCurrency(row.unitPrice)}</td>
                                                <td className="p-2 text-right">{formatCurrency(row.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Repasse de clientes</h3>
                            <div className="bg-white dark:bg-gray-800 rounded shadow border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2">Data</th>
                                            <th className="p-2">Método</th>
                                            <th className="p-2 text-right">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplierRepases.length === 0 && (<tr><td className="p-3 text-gray-500" colSpan={3}>Sem repasses</td></tr>)}
                                        {supplierRepases.map(row => (
                                            <tr key={row.id} className="border-t dark:border-gray-700">
                                                <td className="p-2">{new Date(row.date).toLocaleString()}</td>
                                                <td className="p-2">{String(row.method || '-') }</td>
                                                <td className="p-2 text-right">{formatCurrency(row.amount)}</td>
                                            </tr>
                                        ))}
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

export default Suppliers;
