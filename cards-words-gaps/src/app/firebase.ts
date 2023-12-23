// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {

  apiKey: "AIzaSyB-AimG_Bl6YVBZ4NOjpzEkbsPC0k8iUuE",

  authDomain: "cah-be.firebaseapp.com",

  projectId: "cah-be",

  storageBucket: "cah-be.appspot.com",

  messagingSenderId: "875479068178",

  appId: "1:875479068178:web:9ec3e8e75ef3b5301eb2cb",

  measurementId: "G-38NQG97PFN"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);

const analytics = getAnalytics(app);
