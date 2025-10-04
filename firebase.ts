
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// IMPORTANTE: 
// Substitua o objeto firebaseConfig abaixo pela configuração do seu próprio projeto Firebase.
// Você pode encontrar esses valores no console do Firebase, nas configurações do seu projeto.
// Exemplo:
// const firebaseConfig = {
//   apiKey: "AIzaSyB...",
//   authDomain: "your-project-id.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-project-id.appspot.com",
//   messagingSenderId: "1234567890",
//   appId: "1:1234567890:web:abcdef123456"
// };

// Para maior segurança em um ambiente de produção, é recomendado o uso de variáveis de ambiente.
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};


// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
