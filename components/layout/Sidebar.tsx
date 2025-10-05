import React from 'react';
import { View } from '../../App';
import { BarChart2, ShoppingCart, Package, DollarSign, Users, Truck, Settings, LogOut, Briefcase, CreditCard } from 'lucide-react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import ThemeSwitcher from '../ui/ThemeSwitcher'; // Importa o ThemeSwitcher

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    // A lista de itens de navegação já com ícones intuitivos.
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart },
        { id: 'purchases', label: 'Compras', icon: Package },
        { id: 'inventory', label: 'Estoque', icon: Briefcase },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'suppliers', label: 'Fornecedores', icon: Truck },
        { id: 'expenses', label: 'Despesas', icon: CreditCard },
        { id: 'cash', label: 'Caixa', icon: DollarSign },
        { id: 'settings', label: 'Configurações', icon: Settings },
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            alert("Não foi possível fazer logout. Tente novamente.");
        }
    };

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Cabeçalho com Logo, Nome e o novo ThemeSwitcher */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-indigo-500" />
                    <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">GestorApp</h1>
                </div>
                <ThemeSwitcher />
            </div>
            
            {/* Navegação Principal */}
            <nav className="mt-6 flex-grow">
                <ul>
                    {navItems.map(item => (
                        <li key={item.id} className="px-4 py-1">
                            <button
                                onClick={() => setCurrentView(item.id as View)}
                                className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                                    currentView === item.id
                                        ? 'bg-indigo-500 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                            >
                                <item.icon className="h-5 w-5 mr-3" />
                                {item.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Botão de Logout na parte inferior */}
            <div className="p-4 flex-shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
