import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Suppliers from './components/pages/Suppliers';
import Inventory from './components/pages/Inventory';
import Purchases from './components/pages/Purchases';
import Sales from './components/pages/Sales';
import Expenses from './components/pages/Expenses';
import Login from './components/auth/Login';
import Settings from './components/pages/Settings';
import { AppProvider, AppState } from './context/AppContext';

// This is the shape of our entire application's data
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, SupplierPayment, Expense } from './types';

// Extend AppState to be used here
interface FullAppState extends AppState {
    // No new fields needed, AppState already covers it
}

export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'settings';

// Make CryptoJS available from the global scope (since it's added via CDN)
declare var CryptoJS: any;

export const ENCRYPTED_DATA_KEY = 'app_data_encrypted';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [masterPassword, setMasterPassword] = useState('');
    const [appData, setAppData] = useState<FullAppState | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');

    // Effect to encrypt and save data whenever it changes
    useEffect(() => {
        if (appData && masterPassword) {
            try {
                const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(appData), masterPassword).toString();
                localStorage.setItem(ENCRYPTED_DATA_KEY, encryptedData);
            } catch (error) {
                console.error("Failed to encrypt or save data:", error);
            }
        }
    }, [appData, masterPassword]);

    const handleLoginSuccess = (decryptedData: FullAppState, password: string) => {
        setAppData(decryptedData);
        setMasterPassword(password);
        setIsAuthenticated(true);
    };
    
    const handleLogout = () => {
        setIsAuthenticated(false);
        setMasterPassword('');
        setAppData(null);
        setCurrentView('dashboard'); // Reset view on logout
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard />;
            case 'sales': return <Sales />;
            case 'purchases': return <Purchases />;
            case 'inventory': return <Inventory />;
            case 'customers': return <Customers />;
            case 'suppliers': return <Suppliers />;
            case 'expenses': return <Expenses />;
            case 'settings': return <Settings handleLogout={handleLogout} />;
            default: return <Dashboard />;
        }
    };

    if (!isAuthenticated || !appData) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <AppProvider appData={appData} setAppData={setAppData}>
            <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200">
                <Sidebar currentView={currentView} setCurrentView={setCurrentView} handleLogout={handleLogout} />
                <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                    {renderView()}
                </main>
            </div>
        </AppProvider>
    );
};

export default App;