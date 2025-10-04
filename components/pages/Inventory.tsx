
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Package } from 'lucide-react';

const Inventory: React.FC = () => {
    const { products } = useAppContext();
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Estoque de Produtos</h1>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="p-4 font-semibold">Produto</th>
                            <th className="p-4 font-semibold">Quantidade</th>
                            <th className="p-4 font-semibold">Custo Médio</th>
                            <th className="p-4 font-semibold">Valor Total em Estoque</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b dark:border-gray-700">
                                <td className="p-4 flex items-center"><Package size={16} className="mr-2 text-gray-500" />{product.name}</td>
                                <td className="p-4">{product.quantity}</td>
                                <td className="p-4">{formatCurrency(product.averageCost)}</td>
                                <td className="p-4">{formatCurrency(product.quantity * product.averageCost)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Inventory;
