
import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex flex-col justify-center items-center h-screen w-screen bg-gray-100 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-500"></div>
            <p className="mt-4 text-lg text-gray-700 dark:text-gray-200">Carregando dados...</p>
        </div>
    );
};

export default LoadingSpinner;
