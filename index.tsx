import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Importa o CSS principal com os estilos do Tailwind
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
