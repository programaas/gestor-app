import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Google } from 'lucide-react';
import { auth } from '../../../firebase'; // Importa a instância de auth
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    AuthError // Importa AuthError para tratamento de erros mais específico
} from 'firebase/auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // Estado para alternar entre login e registro

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegistering) {
                // Lógica de registro
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                // Lógica de login
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (err: any) {
            console.error("Erro de autenticação:", err);
            // Tratamento de erros do Firebase Auth
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('E-mail ou senha inválidos.');
            } else if (err.code === 'auth/email-already-in-use') {
                setError('Este e-mail já está em uso. Tente fazer login.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Formato de e-mail inválido.');
            } else if (err.code === 'auth/weak-password') {
                setError('A senha deve ter pelo menos 6 caracteres.');
            } else {
                setError('Ocorreu um erro. Por favor, tente novamente.');
            }
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Erro de login com Google:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Login com Google cancelado.');
            } else {
                setError('Ocorreu um erro ao fazer login com o Google. Tente novamente.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                    <div className="flex items-center justify-center">
                        <LogIn className="h-12 w-auto text-indigo-600" />
                        <h1 className="text-3xl font-bold ml-2 text-gray-800 dark:text-white">GestorApp</h1>
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
                        {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {isRegistering ? 'Gerencie seu negócio na nuvem.' : 'Faça login para continuar sua gestão.'}
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="sr-only">E-mail</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="sr-only">Senha</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                required
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isRegistering ? <><UserPlus className="mr-2 h-5 w-5" /> Registrar</> : <><LogIn className="mr-2 h-5 w-5" /> Acessar</>}
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                Ou
                            </span>
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Google className="mr-2 h-5 w-5" /> Login com Google
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {isRegistering ? 'Já tem uma conta? Acesse' : 'Não tem uma conta? Registre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
