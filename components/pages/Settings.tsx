import React, { useRef } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext.tsx';

interface SettingsProps {
    // handleLogout: () => void; // Removido, pois não é usado diretamente aqui
}

const Settings: React.FC<SettingsProps> = () => {
    const appData = useAppContext();
    const { setAllData } = appData;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            // Exclude the context functions from the export
            const dataToExport = {
                suppliers: appData.suppliers,
                customers: appData.customers,
                products: appData.products,
                purchases: appData.purchases,
                sales: appData.sales,
                customerPayments: appData.customerPayments,
                supplierPayments: appData.supplierPayments,
                expenses: appData.expenses,
                caixaBalance: appData.caixaBalance,
            };

            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `gestorapp_backup_${date}.json`;
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
        
        if (window.confirm('AVISO: Importar um backup irá SOBRESCREVER todos os dados atuais na nuvem. Deseja continuar?')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    if (content) {
                        const importedData: any = JSON.parse(content); // Removed AppState type and used any
                        // Basic validation
                        if (importedData.customers && importedData.products) {
                            setAllData(importedData);
                            alert('Backup importado com sucesso! Os dados foram atualizados.');
                        } else {
                           throw new Error("Invalid file format.");
                        }
                    } else throw new Error("File is empty.");
                } catch (error) {
                    console.error(error);
                    alert('Erro ao importar backup. O arquivo pode estar corrompido ou em formato inválido.');
                }
            };
            reader.readAsText(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Gerenciamento de Dados</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><Download className="mr-2 text-indigo-500" />Exportar Backup</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Salve uma cópia completa dos seus dados em um arquivo JSON. Guarde este arquivo em um local seguro.</p>
                    <button onClick={handleExport} className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600">Exportar Meus Dados</button>
                </div>

                {/* Import Card */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center"><Upload className="mr-2 text-green-500" />Importar Backup</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Restaure seus dados de um arquivo de backup. Esta ação irá substituir todos os dados atuais na nuvem.</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json"/>
                    <button onClick={handleImportClick} className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">Importar de um Arquivo</button>
                </div>
            </div>

            <div className="mt-8 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-md">
                <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                    <div>
                        <p className="font-bold">Aviso Importante sobre Backups</p>
                        <p className="text-sm">Seus dados agora são salvos na nuvem. Use a função de exportação para criar cópias de segurança adicionais para sua tranquilidade.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
