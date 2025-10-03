import React, { useState, useEffect } from 'react';
import { AppState } from '../../context/AppContext.tsx';
import { Lock, DollarSign } from 'lucide-react';

// Make CryptoJS available from the global scope
declare var CryptoJS: any;

const ENCRYPTED_DATA_KEY = 'app_data_encrypted';

interface LoginProps {
    onLoginSuccess: (decryptedData: AppState, password: string) => void;
}

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

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const existingData = localStorage.getItem(ENCRYPTED_DATA_KEY);
        if (!existingData) {
            setIsNewUser(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const encryptedData = localStorage.getItem(ENCRYPTED_DATA_KEY);
        if (!encryptedData) {
            setError("Nenhum dado encontrado. Por favor, configure uma nova senha.");
            setIsNewUser(true);
            return;
        }

        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, password);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedString) {
                throw new Error("Invalid password or corrupted data.");
            }

            const decryptedData = JSON.parse(decryptedString);
            onLoginSuccess(decryptedData, password);
        } catch (err) {
            console.error(err);
            setError('Senha inválida. Por favor, tente novamente.');
        }
    };

    const handleSetup = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        try {
            const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(initialAppState), password).toString();
            localStorage.setItem(ENCRYPTED_DATA_KEY, encryptedData);
            onLoginSuccess(initialAppState, password);
        } catch (error) {
            console.error("Setup failed:", error);
            setError("Ocorreu um erro ao configurar a sua conta.");
        }
    };


    const renderLoginForm = () => (
        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Senha Mestra
                </label>
                <div className="mt-1">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Acessar
                </button>
            </div>
        </form>
    );

     const renderSetupForm = () => (
        <form onSubmit={handleSetup} className="space-y-6">
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Crie sua Senha Mestra
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                         className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                    />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirme sua Senha
                </label>
                <div className="mt-1">
                    <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                    />
                </div>
            </div>
             <div>
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Salvar e Iniciar
                </button>
            </div>
        </form>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                     <div className="flex items-center justify-center">
                         <DollarSign className="h-12 w-auto text-indigo-600" />
                          <h1 className="text-3xl font-bold ml-2 text-gray-800 dark:text-white">GestorApp</h1>
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
                        {isNewUser ? 'Bem-vindo! Configure sua conta.' : 'Acesse sua conta'}
                    </h2>
                     <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {isNewUser ? 'Esta senha irá criptografar todos os seus dados.' : 'Use a sua senha mestra para descriptografar seus dados.'}
                    </p>
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                
                {isNewUser ? renderSetupForm() : renderLoginForm()}
            </div>
        </div>
    );
};

export default Login;