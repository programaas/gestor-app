
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Importar getAuth

// IMPORTANTE: 
// Para maior segurança em um ambiente de produção, é recomendado o uso de variáveis de ambiente.
// Crie um arquivo .env na raiz do seu projeto e adicione as seguintes variáveis:
// VITE_FIREBASE_API_KEY=AIzaSyB...
// VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
// VITE_FIREBASE_PROJECT_ID=your-project-id
// VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
// VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
// VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // Exportar a instância de autenticação
