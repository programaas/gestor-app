
import React from 'react';
import { View } from '../../App';
import { BarChart2, ShoppingCart, Package, DollarSign, Users, Truck, Briefcase } from 'lucide-react';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
        { id: 'sales', label: 'Vendas', icon: ShoppingCart },
        { id: 'purchases', label: 'Compras', icon: Package },
        { id: 'inventory', label: 'Estoque', icon: Briefcase },
        { id: 'customers', label: 'Clientes', icon: Users },
        { id: 'suppliers', label: 'Fornecedores', icon: Truck },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
                 <DollarSign className="h-8 w-8 text-indigo-500" />
                <h1 className="text-xl font-bold ml-2 text-gray-800 dark:text-white">GestorApp</h1>
            </div>
            <nav className="mt-6">
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
        </aside>
    );
};

export default Sidebar;
