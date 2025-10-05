
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { formatCurrency, formatDate } from '../../utils/formatters';


interface ChartData {
    date: string;
    total: number;
}

interface ProductPerformanceData {
    productId: string;
    productName: string;
    category: string;
    quantitySold: number;
    totalValue: number;
}

interface CustomerAnalysisData {
    customerId: string;
    customerName: string;
    totalSpent: number;
    purchaseCount: number;
    lastPurchaseDate: string;
}

const Reports: React.FC = () => {
    const { sales, products, customers } = useAppContext();

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');

    const uniqueCategories = useMemo(() => {
        const categories = new Set(products.map(p => p.category || 'N/A').filter(c => c !== 'N/A'));
        return ['', ...Array.from(categories)];
    }, [products]);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            if (!sale || !sale.date) return false;
            const saleDate = new Date(sale.date);
            if (isNaN(saleDate.getTime())) return false;

            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            if ((start && saleDate < start) || (end && saleDate > end)) return false;
            if (selectedCustomer && sale.customerId !== selectedCustomer) return false;
            return true;
        });
    }, [sales, startDate, endDate, selectedCustomer]);

    const salesChartData = useMemo(() => {
        const dailySales = filteredSales.reduce((acc, sale) => {
            const date = sale.date.substring(0, 10);
            if (!acc[date]) {
                acc[date] = { date, total: 0 };
            }
            acc[date].total += sale.totalAmount;
            return acc;
        }, {} as Record<string, ChartData>);
    
        const chartData: ChartData[] = Object.values(dailySales);
        return chartData.sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredSales]);

    const productPerformanceData = useMemo(() => {
        const performance: Record<string, ProductPerformanceData> = {};
        filteredSales.forEach(sale => {
            sale.products.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product || (selectedCategory && product.category !== selectedCategory)) return;
                if (!performance[item.productId]) {
                    performance[item.productId] = { productId: item.productId, productName: product.name, category: product.category || 'N/A', quantitySold: 0, totalValue: 0 };
                }
                performance[item.productId].quantitySold += item.quantity;
                performance[item.productId].totalValue += item.quantity * item.unitPrice;
            });
        });
        return Object.values(performance).sort((a, b) => b.totalValue - a.totalValue);
    }, [filteredSales, products, selectedCategory]);

    const customerAnalysisData = useMemo(() => {
        const analysis: Record<string, CustomerAnalysisData> = {};
        const validSales = filteredSales.filter(sale => 
            sale && sale.customerId && typeof sale.totalAmount === 'number' && sale.date
        );

        validSales.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (isNaN(saleDate.getTime())) return;

            const customer = customers.find(c => c.id === sale.customerId);
            if (!customer) return;

            if (!analysis[sale.customerId]) {
                analysis[sale.customerId] = {
                    customerId: sale.customerId,
                    customerName: customer.name,
                    totalSpent: 0,
                    purchaseCount: 0,
                    lastPurchaseDate: new Date(0).toISOString(),
                };
            }

            const currentEntry = analysis[sale.customerId];
            currentEntry.totalSpent += sale.totalAmount;
            currentEntry.purchaseCount += 1;

            const lastPurchaseDate = new Date(currentEntry.lastPurchaseDate);
            if (saleDate.getTime() > lastPurchaseDate.getTime()) {
                currentEntry.lastPurchaseDate = saleDate.toISOString();
            }
        });

        return Object.values(analysis).sort((a, b) => b.totalSpent - a.totalSpent);
    }, [filteredSales, customers]);

    const formatDateTick = (tick: string) => {
        try {
            const date = new Date(`${tick}T00:00:00`);
            return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        } catch (e) { return tick; }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Página de Relatórios</h1>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Filtros</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-style" />
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="input-style">
                        {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat || 'Todas as Categorias'}</option>)}
                    </select>
                    <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="input-style">
                        <option value="">Todos os Clientes</option>
                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4">Vendas Diárias</h2>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={formatDateTick} />
                        <YAxis tickFormatter={val => formatCurrency(val as number)} />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} labelFormatter={formatDateTick} />
                        <Legend />
                        <Line type="monotone" dataKey="total" name="Total de Vendas" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Desempenho por Produto</h2>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700"><tr><th className="p-3">Produto</th><th className="p-3 text-right">Qtd. Vendida</th><th className="p-3 text-right">Valor Total</th></tr></thead>
                            <tbody>
                                {productPerformanceData.map(p => (
                                    <tr key={p.productId} className="border-b dark:border-gray-600"><td className="p-3">{p.productName}</td><td className="p-3 text-right">{p.quantitySold}</td><td className="p-3 text-right">{formatCurrency(p.totalValue)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

p                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Análise de Clientes</h2>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700"><tr><th className="p-3">Cliente</th><th className="p-3 text-right">Total Gasto</th><th className="p-3 text-right">Compras</th><th className="p-3">Última Compra</th></tr></thead>
                            <tbody>
                                {customerAnalysisData.map(c => (
                                    <tr key={c.customerId} className="border-b dark:border-gray-600"><td className="p-3">{c.customerName}</td><td className="p-3 text-right">{formatCurrency(c.totalSpent)}</td><td className="p-3 text-right">{c.purchaseCount}</td><td className="p-3">{formatDate(c.lastPurchaseDate)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
