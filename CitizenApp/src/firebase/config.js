import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAFq3tacDRDM8OlR4xDX9mLB0dUW1x5EQ8",
  authDomain: "auth-3ea33.firebaseapp.com",
  projectId: "auth-3ea33",
  storageBucket: "auth-3ea33.firebasestorage.app",
  messagingSenderId: "218182006704",
  appId: "1:218182006704:web:f893c04cbf0dc0d1900875"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
