import React, { useRef } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { ENCRYPTED_DATA_KEY } from '../../App';

interface SettingsProps {
    handleLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ handleLogout }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('Backup exportado com sucesso!');
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
        
        const isConfirmed = window.confirm(
            'AVISO IMPORTANTE:\n\nImportar um backup irá SOBRESCREVER todos os dados atuais. Esta ação não pode ser desfeita.\n\nDeseja continuar?'
        );

        if (isConfirmed) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    // Basic validation: Check if it's not empty and perhaps looks like a Base64 string
                    if (content && content.length > 0) {
                        localStorage.setItem(ENCRYPTED_DATA_KEY, content);
                        alert('Backup importado com sucesso! Você será desconectado para que as alterações entrem em vigor.');
                        handleLogout(); // Force logout to reload with new data
                    } else {
                        throw new Error("File content is empty or invalid.");
                    }
                } catch (error) {
                    console.error("Failed to import data:", error);
                    alert('Ocorreu um erro ao importar o backup. O arquivo pode estar corrompido ou em formato inválido.');
                }
            };
            reader.readAsText(file);
        }
        
        // Reset file input to allow importing the same file again
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Segurança e Dados</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Download className="mr-2 text-indigo-500" />
                        Exportar Backup
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Salve uma cópia de segurança de todos os seus dados. O arquivo exportado é criptografado e só pode ser acessado com sua senha mestra. Guarde-o em um local seguro.
                    </p>
                    <button
                        onClick={handleExport}
                        className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 flex items-center justify-center shadow"
                    >
                        Exportar Meus Dados
                    </button>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <Upload className="mr-2 text-green-500" />
                        Importar Backup
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Restaure seus dados a partir de um arquivo de backup. Esta ação irá substituir todos os dados atuais na aplicação.
                    </p>
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".txt"
                    />
                    <button
                        onClick={handleImportClick}
                        className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center justify-center shadow"
                    >
                        Importar de um Arquivo
                    </button>
                </div>
            </div>

            <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1"><AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" /></div>
                    <div>
                        <p className="font-bold">Aviso Importante sobre seus Dados</p>
                        <p className="text-sm">
                           Seu sistema de gestão salva todos os dados de forma criptografada diretamente no seu navegador. Isso significa que seus dados são privados, mas também que limpar o cache do seu navegador ou usar um dispositivo diferente resultará na perda de acesso a eles.
                           <br/>
                           <strong>É altamente recomendável que você exporte backups regularmente.</strong>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
