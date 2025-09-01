// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgS0BJV9TIcUTgqvB8FYcSmH-_QfcVPS0",
  authDomain: "massiveproductionsbackend.firebaseapp.com",
  projectId: "massiveproductionsbackend",
  storageBucket: "massiveproductionsbackend.firebasestorage.app",
  messagingSenderId: "999538886522",
  appId: "1:999538886522:web:a7c4b2c1cc18aef7afb8c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
