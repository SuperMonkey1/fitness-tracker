import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAw2rvRljiLHrkyJMWYLf1MWRO2-YV5cGo",
    authDomain: "life-tracker-123456.firebaseapp.com",
    projectId: "life-tracker-123456",
    storageBucket: "life-tracker-123456.firebasestorage.app",
    messagingSenderId: "93707647170",
    appId: "1:93707647170:web:96d45bf7409321017ae35b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
