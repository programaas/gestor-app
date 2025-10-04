import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Suppliers from './components/pages/Suppliers';
import Inventory from './components/pages/Inventory';
import Purchases from './components/pages/Purchases';
import Sales from './components/pages/Sales';
import Expenses from './components/pages/Expenses';
import Settings from './components/pages/Settings';
import Login from './components/auth/Login';
import { AppProvider, useAppContext } from './context/AppContext';
import { auth } from '../firebase'; // Importa a instância de auth do firebase.ts
import { User } from 'firebase/auth'; // Importa o tipo User do firebase/auth
import LoadingSpinner from '../components/ui/LoadingSpinner';

export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'settings';

const MainApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const { isLoading } = useAppContext();

    // Renderiza o spinner de carregamento enquanto o contexto está carregando
    if (isLoading) {
        return <LoadingSpinner />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard />;
            case 'sales': return <Sales />;
            case 'purchases': return <Purchases />;
            case 'inventory': return <Inventory />;
            case 'customers': return <Customers />;
            case 'suppliers': return <Suppliers />;
            case 'expenses': return <Expenses />;
            case 'settings': return <Settings />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200">
            {/* Sidebar não precisa mais de handleLogout, pois o logout será global */}
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        // Observa mudanças no estado de autenticação
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoadingAuth(false);
        });

        // Limpa a inscrição ao desmontar o componente
        return () => unsubscribe();
    }, []);

    if (loadingAuth) {
        return <LoadingSpinner />;
    }

    if (!user) {
        // Se não houver usuário autenticado, mostra a tela de login
        return <Login />;
    }

    return (
        <AppProvider>
            <MainApp />
        </AppProvider>
    );
};

export default App;
