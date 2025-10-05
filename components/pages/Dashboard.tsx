
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Users, Truck, Package, DollarSign, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType, color?: string }> = ({ title, value, icon: Icon, color = 'indigo' }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center`}>
        <div className={`bg-${color}-100 dark:bg-${color}-900/50 p-3 rounded-full mr-4`}>
            <Icon className={`h-6 w-6 text-${color}-500`} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { customers, suppliers, products, sales } = useAppContext(); // REMOVA expenses

    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    const totalProfit = sales.reduce((acc, sale) => acc + (sale.totalProfit || 0), 0);
    const totalExpenses = 0; // ou remova essa linha
    const netProfit = totalProfit - totalExpenses;
    const totalCustomerDebt = customers.reduce((acc, customer) => acc + (customer.balance || 0), 0);
    const lowStockProducts = products.filter(p => (p.quantity || 0) <= 5).length;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Receita Bruta (Vendas)" value={formatCurrency(totalRevenue)} icon={DollarSign} color="green" />
                <StatCard title="Lucro Bruto (Vendas)" value={formatCurrency(totalProfit)} icon={TrendingUp} color="green"/>
                <StatCard title="Despesas Totais" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
                <StatCard title="Lucro Líquido" value={formatCurrency(netProfit)} icon={DollarSign} color={netProfit >= 0 ? 'blue' : 'red'}/>
                <StatCard title="Dívida de Clientes" value={formatCurrency(totalCustomerDebt)} icon={Users} />
                <StatCard title="Fornecedores" value={suppliers.length} icon={Truck} />
                <StatCard title="Produtos em Estoque" value={products.length} icon={Package} />
                <StatCard title="Estoque Baixo" value={lowStockProducts} icon={AlertCircle} color="yellow"/>
            </div>

             <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Bem-vindo ao seu Gestor de Negócios!</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Use o menu à esquerda para navegar pelas seções. Você pode registrar novas vendas, compras, despesas, e gerenciar seu estoque, clientes e fornecedores.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
