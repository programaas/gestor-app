import React, { useState } from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

// Make otpauth available from the global scope
declare var otpauth: any;

interface TotpInputProps {
    secret: string;
    onVerifySuccess: () => void;
    onBack: () => void;
}

const TotpInput: React.FC<TotpInputProps> = ({ secret, onVerifySuccess, onBack }) => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const totp = new otpauth.TOTP({
                secret: otpauth.Secret.fromBase32(secret)
            });

            // window: 1 allows for a 30-second tolerance on either side
            const delta = totp.validate({ token: code, window: 1 });

            if (delta === null) {
                setError('Código inválido. Por favor, tente novamente.');
            } else {
                onVerifySuccess();
            }
        } catch (err) {
            console.error("TOTP verification failed:", err);
            setError('Ocorreu um erro ao verificar o código.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg relative">
                <button onClick={onBack} className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <div className="flex items-center justify-center">
                        <ShieldCheck className="h-12 w-auto text-indigo-600" />
                    </div>
                    <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">
                        Verificação de Dois Fatores
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        Abra seu aplicativo autenticador e insira o código de 6 dígitos.
                    </p>
                </div>
                
                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <label htmlFor="totp-code" className="sr-only">
                            Código de 6 dígitos
                        </label>
                        <input
                            id="totp-code"
                            name="totp-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            maxLength={6}
                            className="appearance-none block w-full px-3 py-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-[.5em] bg-white dark:bg-gray-700"
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Verificar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TotpInput;
