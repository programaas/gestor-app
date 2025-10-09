import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import Customers from './components/pages/Customers';
import Suppliers from './components/pages/Suppliers';
import Inventory from './components/pages/Inventory';
import Purchases from './components/pages/Purchases';
import Sales from './components/pages/Sales';
import Settings from './components/pages/Settings';
import Reports from './components/pages/Reports';
import Expenses from './components/pages/Expenses';
import Cash from './components/pages/Cash';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import LoadingSpinner from './components/ui/LoadingSpinner';
import Auth from './components/auth/Auth';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Main application layout
const MainApp: React.FC = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { isLoading } = useAppContext();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-200">
            <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between md:hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <button aria-label="Abrir menu" onClick={() => setSidebarOpen(true)} className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    <span className="sr-only">Abrir menu</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                <h1 className="font-semibold">GestorMax</h1>
                <div className="w-8" />
            </div>

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1 px-4 md:px-6 lg:px-8 overflow-y-auto pt-16 md:pt-0">
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/purchases" element={<Purchases />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/suppliers" element={<Suppliers />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/expenses" element={<Expenses />} />
                        <Route path="/cash" element={<Cash />} />
                        <Route path="/settings" element={<Settings />} />
                        {/* Add a fallback route for any unknown paths */}
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </ErrorBoundary>
            </main>
        </div>
    );
};

// Root component to handle auth and routing
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

    return (
        <Router>
            <AppProvider>
                <ThemeProvider>
                    {!user ? <Auth /> : <MainApp />}
                </ThemeProvider>
            </AppProvider>
        </Router>
    );
};

export default App;