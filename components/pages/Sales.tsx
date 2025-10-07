import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Sale } from '../../types';
import Modal from '../ui/Modal';
import { PlusCircle, X, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface SaleItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    productName?: string;
    profit?: number;
}

const toNumber = (value: any): number => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

type CustomerGroup = {
    customerId: string;
    customerName: string;
    sales: Sale[];
};

const Sales: React.FC = () => {
    const { products = [], customers = [], sales = [], addSale, deleteSale, isLoading } = useAppContext();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
    const [currentItem, setCurrentItem] = useState<Partial<SaleItem>>({ productId: '', quantity: 1, unitPrice: 0 });
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    const customerMap = useMemo(() => new Map(customers.map(c => [c.id, c.name])), [customers]);

    const resetForm = useCallback(() => {
        setSelectedCustomer('');
        setSaleItems([]);
        setCurrentItem({ productId: '', quantity: 1, unitPrice: 0 });
        setIsModalOpen(false);
    }, []);

    const handleAddItem = () => {
        const { productId, quantity, unitPrice } = currentItem;
        const numQuantity = toNumber(quantity);
        const numUnitPrice = toNumber(unitPrice);

        if (!productId || numQuantity <= 0) {
            alert('Selecione um produto e insira uma quantidade válida.');
            return;
        }

        const product = productMap.get(productId);
        if (product) {
            if (numQuantity > toNumber(product.quantity)) {
                alert(`Estoque insuficiente. Disponível: ${product.quantity}`);
                return;
            }
            const profit = (numUnitPrice - toNumber(product.averageCost)) * numQuantity;
            setSaleItems(prev => [...prev, { 
                productId, 
                quantity: numQuantity, 
                unitPrice: numUnitPrice, 
                productName: product.name, 
                profit 
            }]);
            setCurrentItem({ productId: '', quantity: 1, unitPrice: 0 });
        } else {
            alert("Produto não encontrado. A lista de produtos pode ter sido atualizada.");
        }
    };

    const handleRemoveItem = (index: number) => {
        setSaleItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer || saleItems.length === 0) {
            alert('Selecione um cliente e adicione pelo menos um produto.');
            return;
        }
        try {
            const finalItems = saleItems.map(({ productName, profit, ...item }) => item);
            await addSale(selectedCustomer, finalItems);
            resetForm();
        } catch (error) {
            console.error("Falha ao adicionar venda:", error);
        }
    };

    const handleDeleteSale = async (saleId: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
            try {
                await deleteSale(saleId);
            } catch (error) {
                console.error("Falha ao deletar venda:", error);
            }
        }
    };

    const totalSaleAmount = useMemo(() => saleItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0), [saleItems]);
    const totalSaleProfit = useMemo(() => saleItems.reduce((acc, item) => acc + (item.profit || 0), 0), [saleItems]);
    
    const sortedCustomerGroups: CustomerGroup[] = useMemo(() => {
        const groups: Record<string, CustomerGroup> = {};
        (sales || []).forEach(sale => {
            const customerId = sale.customerId;
            if (!customerId) return;
            const customerName = customerMap.get(customerId) || 'Cliente Desconhecido';
            if (!groups[customerId]) {
                groups[customerId] = { customerId, customerName, sales: [] };
            }
            groups[customerId].sales.push(sale);
        });
        return Object.values(groups).sort((a, b) => a.customerName.localeCompare(b.customerName));
    }, [sales, customerMap]);

    if (isLoading && !products.length && !sales.length) {
        return <div className="text-center p-8">Carregando...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Vendas</h1>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center shadow-md transition-colors">
                    <PlusCircle size={20} className="mr-2" />
                    Nova Venda
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                {sortedCustomerGroups.map(({ customerId, customerName, sales: customerSales }) => {
                    const isExpanded = expandedCustomerId === customerId;
                    const totalAmount = customerSales.reduce((sum, s) => sum + toNumber(s.totalAmount), 0);
                    const totalProfit = customerSales.reduce((sum, s) => sum + toNumber(s.totalProfit), 0);

                    return (
                        <div key={customerId} className="border-b dark:border-gray-700 last:border-b-0">
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setExpandedCustomerId(isExpanded ? null : customerId)}>
                                <div className="flex items-center">
                                    {isExpanded ? <ChevronDown size={20} className="mr-3 text-indigo-500" /> : <ChevronRight size={20} className="mr-3 text-gray-500" />}
                                    <span className="font-semibold text-lg text-gray-800 dark:text-white">{customerName}</span>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalAmount)}</p>
                                    <p className={`text-sm ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(totalProfit)} Lucro</p>
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-3">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 dark:border-gray-600"><th className="p-2 font-semibold">Data</th><th className="p-2 font-semibold">Produtos</th><th className="p-2 font-semibold text-right">Valor</th><th className="p-2 font-semibold text-right">Lucro</th><th className="p-2 font-semibold text-center">Ações</th></tr>
                                        </thead>
                                        <tbody>
                                            {customerSales.slice().reverse().map(sale => (
                                                <tr key={sale.id} className="border-b dark:border-gray-700 last:border-b-0">
                                                    <td className="p-2 align-top">{new Date(sale.date).toLocaleString()}</td>
                                                    <td className="p-2 align-top"><ul className="list-disc list-inside space-y-1">{(sale.products || []).map((p, index) => (<li key={index}>{productMap.get(p.productId)?.name || 'Produto removido'} ({toNumber(p.quantity)}x {formatCurrency(p.unitPrice)})</li>))}</ul></td>
                                                    <td className="p-2 align-top text-right">{formatCurrency(sale.totalAmount)}</td>
                                                    <td className={`p-2 align-top text-right ${toNumber(sale.totalProfit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(sale.totalProfit)}</td>
                                                    <td className="p-2 align-top text-center"><button onClick={() => handleDeleteSale(sale.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Modal isOpen={isModalOpen} onClose={resetForm} title="Registrar Nova Venda">
                <form onSubmit={handleAddSale} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                        <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" required>
                            <option value="">Selecione um cliente</option>
                            {customers.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                        </select>
                    </div>
                    <div className="border-t dark:border-gray-600 pt-4">
                        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Itens da Venda</h3>
                        <div className="flex flex-wrap items-start gap-4 mb-4 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                            <div className="flex-grow min-w-[150px]"><label className="block text-sm font-medium">Produto</label><select value={currentItem.productId} onChange={e => setCurrentItem(prev => ({ ...prev, productId: e.target.value }))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md"><option value="">Selecione</option>{products.filter(p => toNumber(p.quantity) > 0).map(p => (<option key={p.id} value={p.id}>{p.name} (Estoque: {p.quantity})</option>))}</select></div>
                            <div className="flex-grow w-1/4 min-w-[100px]"><label className="block text-sm font-medium">Preço</label><input type="number" placeholder="0.00" value={currentItem.unitPrice} onChange={e => setCurrentItem(prev => ({ ...prev, unitPrice: e.target.valueAsNumber || 0 }))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md" step="0.01" min="0" /></div>
                            <div className="flex-grow w-1/4 min-w-[80px]"><label className="block text-sm font-medium">Qtd.</label><input type="number" placeholder="1" value={currentItem.quantity} onChange={e => setCurrentItem(prev => ({ ...prev, quantity: e.target.valueAsNumber || 1 }))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md" min="1" /></div>
                            <div className="self-end"><button type="button" onClick={handleAddItem} className="bg-green-500 text-white p-2 rounded-md hover:bg-green-600"><PlusCircle size={20}/></button></div>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                            {saleItems.map((item, index) => (<div key={index} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-md"><div><p className="font-semibold">{item.productName}</p><p className="text-sm text-gray-600 dark:text-gray-300">{item.quantity} x {formatCurrency(item.unitPrice)} = {formatCurrency(item.quantity * item.unitPrice)}</p>{item.profit !== undefined && (<p className={`text-sm ${item.profit >= 0 ? 'text-green-600' : 'text-red-500'} dark:text-opacity-80`}>Lucro: {formatCurrency(item.profit)}</p>)}</div><button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700"><X size={18} /></button></div>))}
                        </div>
                    </div>
                    {saleItems.length > 0 && (<div className="border-t dark:border-gray-600 pt-4 mt-4 text-right"><p className="text-lg font-semibold">Valor Total: {formatCurrency(totalSaleAmount)}</p><p className={`text-lg font-semibold ${totalSaleProfit >= 0 ? 'text-green-600' : 'text-red-500'} dark:text-opacity-90`}>Lucro Total: {formatCurrency(totalSaleProfit)}</p></div>)}
                    <div className="flex justify-end pt-6"><button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300" disabled={isLoading || saleItems.length === 0}>{isLoading ? 'Salvando...' : 'Registrar Venda'}</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default Sales;
