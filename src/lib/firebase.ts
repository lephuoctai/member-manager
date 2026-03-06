import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIluW6YxAIYaa_rVZnixBj-OwRqBwHOeU",
  authDomain: "authfbase-774b1.firebaseapp.com",
  projectId: "authfbase-774b1",
  storageBucket: "authfbase-774b1.firebasestorage.app",
  messagingSenderId: "286919618707",
  appId: "1:286919618707:web:d6db19eca0edfca7ef9d66",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;

