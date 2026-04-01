export const environment = {
  production: true,
  // Da wir WebRTC und P2P nutzen, benötigen wir keinen externen Backend-Server mehr.
  // Die Anwendung läuft vollständig im Browser (GitHub Pages).
  backendUrl: '',
  socketUrl: window.location.origin,
  firebase: {
    apiKey: "AIzaSyB-AimG_Bl6YVBZ4NOjpzEkbsPC0k8iUuE",
    authDomain: "cah-be.firebaseapp.com",
    databaseURL: "https://cah-be-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cah-be",
    storageBucket: "cah-be.appspot.com",
    messagingSenderId: "875479068178",
    appId: "1:875479068178:web:9ec3e8e75ef3b5301eb2cb",
    measurementId: "G-38NQG97PFN"
  }
};
