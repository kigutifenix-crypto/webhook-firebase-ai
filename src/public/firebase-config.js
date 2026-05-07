// Firebase Web SDK Configuration
// Importar os SDKs necessários
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Configuração do Firebase (fornecida pelo usuário)
const firebaseConfig = {
  apiKey: "AIzaSyDrXf82t2r3hKzBxoPxvTsxmkwUo5xFjR0",
  authDomain: "qr-code-maquinas-60cb9.firebaseapp.com",
  databaseURL: "https://qr-code-maquinas-60cb9-default-rtdb.firebaseio.com",
  projectId: "qr-code-maquinas-60cb9",
  storageBucket: "qr-code-maquinas-60cb9.firebasestorage.app",
  messagingSenderId: "156754965195",
  appId: "1:156754965195:web:a79e8472bb1dab0ab9614e",
  measurementId: "G-TJB34JTFS3"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Exportar database para uso no dashboard
window.firebaseDatabase = database;
window.firebaseRefs = {
  ref,
  onValue,
  query,
  limitToLast
};

console.log('✅ Firebase inicializado com sucesso');
