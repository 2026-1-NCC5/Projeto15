import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Substitua pelos dados do seu Console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDBLkJUFcmwnixj32jCr-ZW1uUG7uBXvb8",
  authDomain: "lecontagem-1d7e2.firebaseapp.com",
  projectId: "lecontagem-1d7e2",
  storageBucket: "lecontagem-1d7e2.firebasestorage.app",
  messagingSenderId: "730486633380",
  appId: "1:730486633380:web:bb1b9166b484d787b68731",
  measurementId: "G-16SKK5MSTB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);