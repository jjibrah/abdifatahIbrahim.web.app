import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfYSRkOp3Rpzx246KcvAU72Jidk59VwFk",
  authDomain: "my-portfolio-45ff0.firebaseapp.com",
  projectId: "my-portfolio-45ff0",
  storageBucket: "my-portfolio-45ff0.firebasestorage.app",
  messagingSenderId: "439232880032",
  appId: "1:439232880032:web:5da6b51b0d37cd915918c5",
  measurementId: "G-8ERD5N6LRS" // Add your measurement ID here if you have it, otherwise Firebase often auto-detects
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
export { logEvent };
