
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Users, Truck, Package, DollarSign, AlertCircle } from 'lucide-react';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full mr-4">
            <Icon className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { customers, suppliers, products, sales } = useAppContext();

    const totalRevenue = sales.reduce((acc, sale) => acc + (sale.quantity * sale.unitPrice), 0);
    const totalCustomerDebt = customers.reduce((acc, customer) => acc + customer.balance, 0);
    const lowStockProducts = products.filter(p => p.quantity <= 5).length;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Receita Total" value={formatCurrency(totalRevenue)} icon={DollarSign} />
                <StatCard title="Clientes" value={customers.length} icon={Users} />
                <StatCard title="Fornecedores" value={suppliers.length} icon={Truck} />
                <StatCard title="Produtos em Estoque" value={products.length} icon={Package} />
                <StatCard title="Dívida de Clientes" value={formatCurrency(totalCustomerDebt)} icon={DollarSign} />
                <StatCard title="Produtos com Estoque Baixo" value={lowStockProducts} icon={AlertCircle} />
            </div>

             <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Bem-vindo ao seu Gestor de Negócios!</h2>
                <p className="text-gray-600 dark:text-gray-300">
                    Use o menu à esquerda para navegar pelas seções. Você pode registrar novas vendas, compras, gerenciar seu estoque, clientes e fornecedores.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <strong>Aviso:</strong> Todos os dados são salvos localmente no seu navegador. Limpar o cache do navegador irá apagar todos os registros.
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
