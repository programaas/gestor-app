
import React from 'react';
import { Cloud } from 'lucide-react';

const Settings: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Segurança e Dados</h1>

            <div className="bg-green-100 dark:bg-green-900/50 border-l-4 border-green-500 text-green-800 dark:text-green-200 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1"><Cloud className="h-5 w-5 text-green-500 mr-3" /></div>
                    <div>
                        <p className="font-bold">Seus Dados Estão Seguros na Nuvem</p>
                        <p className="text-sm">
                            Boas notícias! Seu sistema de gestão agora salva todos os seus dados de forma segura e automática no Firestore, a solução de banco de dados em nuvem do Google.
                            <br/><br/>
                            Isso significa que:
                            <ul className="list-disc list-inside ml-2 mt-2">
                                <li>Seus dados estão protegidos e sempre disponíveis.</li>
                                <li>Você pode acessar suas informações de qualquer dispositivo, a qualquer momento.</li>
                                <li>Não há mais necessidade de se preocupar com backups manuais.</li>
                            </ul>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
