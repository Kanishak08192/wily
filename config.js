import * as firebase from 'firebase';
require('@firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAj3NSJSyKQK1d2uMQOKBVwPIJH3XTUUCM",
  authDomain: "wily-c055b.firebaseapp.com",
  projectId: "wily-c055b",
  storageBucket: "wily-c055b.appspot.com",
  messagingSenderId: "112625067682",
  appId: "1:112625067682:web:cd35467832fe2669f119fb"
};

  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore();