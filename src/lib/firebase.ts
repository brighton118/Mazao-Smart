import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBfOsGVIrynHbCePXDj10jp2SwToOwqTTk",
    authDomain: "agrisense-38d3c.firebaseapp.com",
    projectId: "agrisense-38d3c",
    storageBucket: "agrisense-38d3c.firebasestorage.app",
    messagingSenderId: "572878707761",
    appId: "1:572878707761:web:1a8238bf26045368a60910",
    measurementId: "G-XZNKEP1Z93"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
