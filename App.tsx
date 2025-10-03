import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import Customers from './components/pages/Customers.tsx';
import Suppliers from './components/pages/Suppliers.tsx';
import Inventory from './components/pages/Inventory.tsx';
import Purchases from './components/pages/Purchases.tsx';
import Sales from './components/pages/Sales.tsx';
import Expenses from './components/pages/Expenses.tsx';
import Login from './components/auth/Login.tsx';
import TotpInput from './components/auth/TotpInput.tsx';
import Settings from './components/pages/Settings.tsx';
import { AppProvider, AppState } from './context/AppContext.tsx';

// This is the shape of our entire application's data
import { Supplier, Customer, Product, Purchase, Sale, CustomerPayment, SupplierPayment, Expense } from './types.ts';

export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'settings';

// Make CryptoJS available from the global scope (since it's added via CDN)
declare var CryptoJS: any;

export const ENCRYPTED_DATA_KEY = 'app_data_encrypted';

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [masterPassword, setMasterPassword] = useState('');
    const [appData, setAppData] = useState<AppState | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    
    // State to manage the 2FA (TOTP) step
    const [pendingData, setPendingData] = useState<{data: AppState, pass: string} | null>(null);

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

    const handleLoginSuccess = (decryptedData: AppState, password: string) => {
        // If TOTP is enabled, don't log in yet. Move to the TOTP verification step.
        if (decryptedData.totpSecret) {
            setPendingData({ data: decryptedData, pass: password });
        } else {
            // If TOTP is not enabled, log in directly.
            setAppData(decryptedData);
            setMasterPassword(password);
            setIsAuthenticated(true);
        }
    };

    const handleTotpVerificationSuccess = () => {
        if (pendingData) {
            setAppData(pendingData.data);
            setMasterPassword(pendingData.pass);
            setIsAuthenticated(true);
            setPendingData(null); // Clear pending data
        }
    };
    
    const handleLogout = () => {
        setIsAuthenticated(false);
        setMasterPassword('');
        setAppData(null);
        setPendingData(null);
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

    if (pendingData) {
        return (
            <TotpInput
                secret={pendingData.data.totpSecret!}
                onVerifySuccess={handleTotpVerificationSuccess}
                onBack={() => setPendingData(null)}
            />
        );
    }

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