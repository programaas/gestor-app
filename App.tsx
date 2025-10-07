
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Suppliers from './components/pages/Suppliers';
import Inventory from './components/pages/Inventory';
import Purchases from './components/pages/Purchases';
import Sales from './components/pages/Sales';
import Settings from './components/pages/Settings';
import Reports from './components/pages/Reports';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext'; 
import LoadingSpinner from './components/ui/LoadingSpinner';
import Auth from './components/auth/Auth';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import ErrorBoundary from './components/ui/ErrorBoundary'; // Importa o ErrorBoundary

// Adiciona 'reports' ao tipo View
export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'reports' | 'settings';

const MainApp: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const { isLoading } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard />;
            case 'sales':
                return <Sales />;
            case 'purchases':
                return <Purchases />;
            case 'inventory':
                return <Inventory />;
            case 'customers':
                return <Customers />;
            case 'suppliers':
                return <Suppliers />;
            case 'reports': // Adiciona o case para a nova view
                return <ErrorBoundary><Reports /></ErrorBoundary>;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {renderView()}
            </main>
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);

            if (currentUser) {
                const timestamp = new Date().toISOString();
                console.log(`[ACCESS LOG] User logged in: ${currentUser.email || currentUser.uid} at ${timestamp}`);
            }
        });
        return () => unsubscribe();
    }, []);

    if (authLoading) {
        return <LoadingSpinner />;
    }

    if (!user) {
        return <Auth />;
    }

    return (
        <AppProvider>
            <ThemeProvider>
                <MainApp />
            </ThemeProvider>
        </AppProvider>
    );
};

export default App;
