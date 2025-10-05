import React from 'react';
import { useTheme } from '../../context/ThemeContext'; // Caminho corrigido
import { Sun, Moon } from 'lucide-react';

const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon size={22} className="text-indigo-500" />
            ) : (
                <Sun size={22} className="text-yellow-500" />
            )}
        </button>
    );
};

export default ThemeSwitcher;
