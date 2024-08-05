// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbiuLatmSQad2DS_rV5CuKO1dFdXltA-M",
  authDomain: "inventory-management-app-5f178.firebaseapp.com",
  projectId: "inventory-management-app-5f178",
  storageBucket: "inventory-management-app-5f178.appspot.com",
  messagingSenderId: "631437114808",
  appId: "1:631437114808:web:a86ff683ff49dd48d1634d",
  measurementId: "G-YXWXDZRPW6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);