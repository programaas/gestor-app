
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Suppliers from './components/pages/Suppliers';
import Inventory from './components/pages/Inventory';
import Purchases from './components/pages/Purchases';
import Sales from './components/pages/Sales';
import { AppProvider, useAppContext } from './context/AppContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers';

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
}

const App: React.FC = () => {
    return (
        <AppProvider>
            <MainApp />
        </AppProvider>
    );
};

export default App;
