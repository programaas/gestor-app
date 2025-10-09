import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Truck, Package, Users, Briefcase, Settings, BarChart2, Sun, Moon, LogOut, DollarSign } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../firebase';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose = () => {} }) => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();

    const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => {
        const isActive = location.pathname === to;
        return (
            <li>
                <Link
                    to={to}
                    onClick={onClick}
                    className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${
                        isActive
                            ? 'bg-indigo-500 text-white shadow-lg'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    {icon}
                    <span className="ml-4 font-medium">{label}</span>
                </Link>
            </li>
        );
    };

    const handleLogout = () => {
        if (window.confirm("Tem certeza que deseja sair do sistema?")) {
            auth.signOut().catch((error) => {
                console.error("Erro ao fazer logout:", error);
            });
        }
    };

    const navigationItems = (isMobile = false) => (
        <ul className="space-y-2">
            <NavItem to="/dashboard" icon={<Home size={22} />} label="Dashboard" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/sales" icon={<ShoppingCart size={22} />} label="Vendas" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/purchases" icon={<Truck size={22} />} label="Compras" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/inventory" icon={<Package size={22} />} label="Estoque" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/customers" icon={<Users size={22} />} label="Clientes" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/suppliers" icon={<Briefcase size={22} />} label="Fornecedores" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/expenses" icon={<DollarSign size={22} />} label="Despesas" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/cash" icon={<DollarSign size={22} />} label="Caixa" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/reports" icon={<BarChart2 size={22} />} label="Relatórios" onClick={isMobile ? onClose : undefined} />
            <NavItem to="/settings" icon={<Settings size={22} />} label="Configurações" onClick={isMobile ? onClose : undefined} />
        </ul>
    );

    const Desktop = (
        <aside className="hidden md:flex w-64 bg-white dark:bg-gray-800 shadow-md flex-col justify-between transition-colors duration-300">
            <div>
                <div className="p-6 text-center">
                    <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">GestorMax</h1>
                </div>
                <nav className="px-4">
                    {navigationItems()}
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

    const Mobile = (
        <>
            {isOpen && (
                <div className="md:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/40" onClick={onClose} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-white dark:bg-gray-800 shadow-lg flex flex-col justify-between">
                        <div>
                            <div className="p-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">GestorMax</h1>
                                <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <span className="sr-only">Fechar</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                            <nav className="px-4 py-3">
                                {navigationItems(true)}
                            </nav>
                        </div>
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center">
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
                </div>
            )}
        </>
    );

    return (
        <>
            {Desktop}
            {Mobile}
        </>
    );
};

export default Sidebar;