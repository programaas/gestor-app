import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, AlertTriangle, ShieldCheck, ShieldOff } from 'lucide-react';
import { ENCRYPTED_DATA_KEY } from '../../App.tsx';
import { useAppContext } from '../../context/AppContext.tsx';
import Modal from '../ui/Modal.tsx';

// Make otpauth and QRCode available from the global scope (added via CDN)
declare var otpauth: any;
declare var QRCode: any;

interface SettingsProps {
    handleLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ handleLogout }) => {
    const { totpSecret, enableTotp, disableTotp } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isTotpModalOpen, setTotpModalOpen] = useState(false);
    const [newTotpSecret, setNewTotpSecret] = useState('');
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isTotpModalOpen && !totpSecret) {
            // Generate a new secret for setup
            const totp = otpauth.TOTP.generate({
                issuer: 'GestorApp',
                label: 'SuaConta',
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
            });
            setNewTotpSecret(totp.secret.base32);
            QRCode.toDataURL(totp.toString(), { width: 256, margin: 2 }, (err, url) => {
                if (err) console.error(err);
                else setQrCodeDataUrl(url);
            });
        }
    }, [isTotpModalOpen, totpSecret]);

    const handleExport = () => {
        try {
            const encryptedData = localStorage.getItem(ENCRYPTED_DATA_KEY);
            if (!encryptedData) {
                alert('Nenhum dado encontrado para exportar.');
                return;
            }
            const blob = new Blob([encryptedData], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `gestorapp_backup_${date}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert('Ocorreu um erro ao exportar o backup.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        if (window.confirm('AVISO: Importar um backup irá SOBRESCREVER todos os dados atuais. Deseja continuar?')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    if (content) {
                        localStorage.setItem(ENCRYPTED_DATA_KEY, content);
                        alert('Backup importado com sucesso! Você será desconectado.');
                        handleLogout();
                    } else throw new Error("File is empty.");
                } catch (error) {
                    alert('Erro ao importar backup. O arquivo pode estar corrompido.');
                }
            };
            reader.readAsText(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleEnableTotp = () => {
        setError('');
        const totp = new otpauth.TOTP({ secret: otpauth.Secret.fromBase32(newTotpSecret) });
        const delta = totp.validate({ token: verificationCode, window: 1 });
        if (delta === null) {
            setError('Código de verificação inválido.');
            return;
        }
        enableTotp(newTotpSecret);
        setTotpModalOpen(false);
        setVerificationCode('');
    };

    const handleDisableTotp = () => {
        setError('');
        const totp = new otpauth.TOTP({ secret: otpauth.Secret.fromBase32(totpSecret!) });
        const delta = totp.validate({ token: verificationCode, window: 1 });
        if (delta === null) {
            setError('Código de verificação inválido.');
            return;
        }
        disableTotp();
        setTotpModalOpen(false);
        setVerificationCode('');
    };

    const openModal = () => {
        setVerificationCode('');
        setError('');
        setTotpModalOpen(true);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Segurança e Dados</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2FA Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        {totpSecret ? <ShieldCheck className="mr-2 text-green-500" /> : <ShieldOff className="mr-2 text-yellow-500" />}
                        Autenticação de Dois Fatores (2FA)
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                       {totpSecret 
                            ? "A proteção 2FA está ativa. Para acessar sua conta, você precisará da sua senha e de um código do seu app autenticador."
                            : "Adicione uma camada extra de segurança à sua conta. Exija um código de verificação do seu celular para fazer login."
                       }
                    </p>
                    <button
                        onClick={openModal}
                        className={`w-full text-white px-4 py-2 rounded-lg flex items-center justify-center shadow ${
                            totpSecret 
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    >
                        {totpSecret ? 'Desabilitar 2FA' : 'Habilitar 2FA'}
                    </button>
                </div>

                {/* Export Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><Download className="mr-2 text-indigo-500" />Exportar Backup</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Salve uma cópia criptografada dos seus dados. Guarde este arquivo em um local seguro.</p>
                    <button onClick={handleExport} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Exportar Meus Dados</button>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><Upload className="mr-2 text-green-500" />Importar Backup</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Restaure seus dados de um arquivo. Esta ação irá substituir todos os dados atuais.</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".txt"/>
                    <button onClick={handleImportClick} className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Importar de um Arquivo</button>
                </div>
            </div>

            <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
                <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                        <p className="font-bold">Aviso Importante sobre seus Dados</p>
                        <p className="text-sm">Seus dados são salvos localmente. Limpar o cache do navegador resultará na perda de acesso. Exporte backups regularmente.</p>
                    </div>
                </div>
            </div>

            <Modal isOpen={isTotpModalOpen} onClose={() => setTotpModalOpen(false)} title={totpSecret ? 'Desabilitar 2FA' : 'Configurar 2FA'}>
                {totpSecret ? ( // Disable Flow
                    <div className="space-y-4">
                        <p>Para confirmar, insira o código de 6 dígitos do seu aplicativo autenticador.</p>
                        <div>
                            <label className="block text-sm font-medium">Código de Verificação</label>
                            <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={6} className="mt-1 block w-full text-center tracking-widest text-lg" required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button onClick={handleDisableTotp} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Desabilitar</button>
                    </div>
                ) : ( // Enable Flow
                    <div className="space-y-4 text-center">
                        <p className="text-sm">1. Escaneie este QR Code com seu app autenticador (Google Authenticator, Authy, etc).</p>
                        {qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="mx-auto my-4 p-2 bg-white rounded-lg"/>}
                        <p className="text-xs">Ou insira a chave manualmente: <br/><code className="bg-gray-200 dark:bg-gray-700 p-1 rounded font-mono">{newTotpSecret}</code></p>
                        <hr className="dark:border-gray-600 my-4"/>
                        <p className="text-sm">2. Insira o código de 6 dígitos gerado pelo app para verificar e concluir a configuração.</p>
                        <div>
                            <label className="block text-sm font-medium text-left">Código de Verificação</label>
                            <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} maxLength={6} className="mt-1 block w-full text-center tracking-widest text-lg" required />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <button onClick={handleEnableTotp} className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">Habilitar e Verificar</button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Settings;
