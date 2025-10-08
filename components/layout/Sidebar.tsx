
import React, { useState } from 'react';
import { View } from '../../App';
import { Home, ShoppingCart, Truck, Package, Users, Briefcase, Settings, BarChart2, Sun, Moon, LogOut, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../firebase';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const { theme, toggleTheme } = useTheme();

    const NavItem: React.FC<{ view: View; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
        <li>
            <a
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentView(view); }}
                className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${currentView === view
                        ? 'bg-indigo-500 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
            >
                {icon}
                <span className="ml-4 font-medium">{label}</span>
            </a>
        </li>
    );

    const handleLogout = () => {
        if (window.confirm("Tem certeza que deseja sair do sistema?")) {
            auth.signOut().then(() => {
                console.log('Usuário deslogado com sucesso.');
            }).catch((error) => {
                console.error("Erro ao fazer logout:", error);
            });
        }
    };

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-md flex flex-col justify-between transition-colors duration-300">
            <div>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">GestorMax</h1>
                </div>
                <nav className="px-4">
                    <ul className="space-y-2">
                        <NavItem view="dashboard" icon={<Home size={22} />} label="Dashboard" />
                        <NavItem view="sales" icon={<ShoppingCart size={22} />} label="Vendas" />
                        <NavItem view="purchases" icon={<Truck size={22} />} label="Compras" />
                        <NavItem view="inventory" icon={<Package size={22} />} label="Estoque" />
                        <NavItem view="customers" icon={<Users size={22} />} label="Clientes" />
                        <NavItem view="suppliers" icon={<Briefcase size={22} />} label="Fornecedores" />
                        <NavItem view="expenses" icon={<DollarSign size={22} />} label="Despesas" />
                        <NavItem view="cash" icon={<DollarSign size={22} />} label="Caixa" />
                        {/* Ação de clique corrigida para Relatórios */}
                        <NavItem view="reports" icon={<BarChart2 size={22} />} label="Relatórios" />
                        <NavItem view="settings" icon={<Settings size={22} />} label="Configurações" />
                    </ul>
                </nav>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-around items-center mb-4">
                     <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-lg transition-colors">
                        <LogOut size={20} />
                        <span className="ml-2 font-medium">Sair</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
