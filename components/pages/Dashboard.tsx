import React from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { Users, Truck, Package, DollarSign, AlertCircle, Wallet, Receipt } from 'lucide-react';

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
    const { customers, suppliers, products, sales, caixaBalance, expenses } = useAppContext();

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const totalCustomerDebt = customers.reduce((acc, customer) => acc + customer.balance, 0);
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const lowStockProducts = products.filter(p => p.quantity <= 5).length;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const suppliersWithDebt = suppliers.filter(s => s.balance > 0);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Receita Total" value={formatCurrency(totalRevenue)} icon={DollarSign} />
                <StatCard title="Saldo em Caixa" value={formatCurrency(caixaBalance)} icon={Wallet} />
                <StatCard title="Total de Despesas" value={formatCurrency(totalExpenses)} icon={Receipt} />
                <StatCard title="Dívida de Clientes" value={formatCurrency(totalCustomerDebt)} icon={DollarSign} />
                <StatCard title="Clientes" value={customers.length} icon={Users} />
                <StatCard title="Fornecedores" value={suppliers.length} icon={Truck} />
                <StatCard title="Produtos em Estoque" value={products.length} icon={Package} />
                <StatCard title="Produtos com Estoque Baixo" value={lowStockProducts} icon={AlertCircle} />
            </div>

             <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold mb-4">Bem-vindo ao seu Gestor de Negócios!</h2>
                    <p className="text-gray-600 dark:text-gray-300">
                        Use o menu à esquerda para navegar pelas seções. Você pode registrar novas vendas, compras, gerenciar seu estoque, clientes e fornecedores.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                        <strong>Status:</strong> Seus dados estão sendo salvos automaticamente e com segurança na nuvem.
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h3 className="font-bold text-lg mb-4 flex items-center">
                        <Truck className="mr-2 h-5 w-5 text-orange-500"/>
                        Dívidas a Fornecedores
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {suppliersWithDebt.length > 0 ? (
                            suppliersWithDebt.map(supplier => (
                                <div key={supplier.id} className="flex justify-between items-center text-sm">
                                    <span>{supplier.name}</span>
                                    <span className="font-semibold text-orange-500">{formatCurrency(supplier.balance)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma dívida no momento.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;