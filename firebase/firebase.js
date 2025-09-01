// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLq5KEYwGoODg-IhX-KD_wq7glWW719d0",
  authDomain: "twinxcarebackend.firebaseapp.com",
  projectId: "twinxcarebackend",
  storageBucket: "twinxcarebackend.firebasestorage.app",
  messagingSenderId: "791637368111",
  appId: "1:791637368111:web:2110bb059b6427ca3295da"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
