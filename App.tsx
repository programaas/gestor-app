import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import Customers from './components/pages/Customers.tsx';
import Suppliers from './components/pages/Suppliers.tsx';
import Inventory from './components/pages/Inventory.tsx';
import Purchases from './components/pages/Purchases.tsx';
import Sales from './components/pages/Sales.tsx';
import Expenses from './components/pages/Expenses.tsx';
import Auth from './components/auth/Auth.tsx';
import Settings from './components/pages/Settings.tsx';
import { AppProvider, AppState } from './context/AppContext.tsx';
import { auth, firestore } from './firebase/config.ts';
import { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export type View = 'dashboard' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'suppliers' | 'expenses' | 'settings';

const initialAppState: AppState = {
    suppliers: [],
    customers: [],
    products: [],
    purchases: [],
    sales: [],
    customerPayments: [],
    supplierPayments: [],
    expenses: [],
    caixaBalance: 0,
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [appData, setAppData] = useState<AppState | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                // Fetch user data from Firestore
                const userDocRef = firestore.collection('users').doc(firebaseUser.uid);
                const doc = await userDocRef.get();
                if (doc.exists) {
                    setAppData(doc.data() as AppState);
                } else {
                    // First login, create the initial document
                    await userDocRef.set(initialAppState);
                    setAppData(initialAppState);
                }
            } else {
                setUser(null);
                setAppData(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const updateFirestore = async (newState: AppState) => {
        if (user) {
            try {
                const userDocRef = firestore.collection('users').doc(user.uid);
                await userDocRef.set(newState);
            } catch (error) {
                console.error("Error updating Firestore:", error);
                alert("Não foi possível salvar os dados. Verifique sua conexão.");
            }
        }
    };
    
    const handleLogout = () => {
        auth.signOut().then(() => {
            setCurrentView('dashboard');
        });
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

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!user || appData === null) {
        return <Auth />;
    }

    return (
        <AppProvider appData={appData} setAppData={setAppData} updateFirestore={updateFirestore}>
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
