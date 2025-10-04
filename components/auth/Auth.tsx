import React, { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { auth } from '../../firebase'; // Importa a instância de auth do firebase.ts na raiz
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';

const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!isLoginView && password !== confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password); // Usando a função modular
            } else {
                await createUserWithEmailAndPassword(auth, email, password); // Usando a função modular
            }
            // onAuthStateChanged in App.tsx will handle the rest
        } catch (err: any) {
            console.error(err);
            switch (err.code) {
                case 'auth/user-not-found':
                    setError('Nenhuma conta encontrada com este e-mail.');
                    break;
                case 'auth/wrong-password':
                    setError('Senha incorreta. Por favor, tente novamente.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este e-mail já está em uso. Tente fazer login.');
                    break;
                case 'auth/weak-password':
                    setError('A senha deve ter pelo menos 6 caracteres.');
                    break;
                default:
                    setError('Ocorreu um erro. Tente novamente mais tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                     <div className="flex items-center justify-center">
                         <DollarSign className="h-12 w-auto text-indigo-600" />
                          <h1 className="text-3xl font-bold ml-2 text-gray-800 dark:text-white">GestorApp</h1>
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
                        {isLoginView ? 'Acesse sua conta' : 'Crie sua conta'}
                    </h2>
                </div>
                
                <form onSubmit={handleAuthAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            E-mail
                        </label>
                        <div className="mt-1">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                           Senha
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
                    {!isLoginView && (
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
                    )}

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLoginView ? 'Entrar' : 'Cadastrar')}
                        </button>
                    </div>

                    <p className="text-center text-sm">
                        <button type="button" onClick={() => { setIsLoginView(!isLoginView); setError(''); }} className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                           {isLoginView ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Auth;
