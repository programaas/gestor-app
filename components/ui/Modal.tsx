
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-0 sm:p-4">
            <div className="bg-white dark:bg-gray-800 w-full h-full sm:h-auto sm:rounded-lg shadow-2xl sm:max-w-lg overflow-hidden transform transition-all sm:my-8">
                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-4 sm:p-6 max-h-[calc(100vh-6rem)] sm:max-h-none overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
