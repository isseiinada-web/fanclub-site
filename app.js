import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA43kFNncTrEKhedVSunTReZQvPzMTKhj0",
  authDomain: "brothers-fanclub.firebaseapp.com",
  projectId: "brothers-fanclub",
  storageBucket: "brothers-fanclub.firebasestorage.app",
  messagingSenderId: "818864836252",
  appId: "1:818864836252:web:a5fe021cb0a97c6877e759",
  measurementId: "G-KBM70KG1DH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginPage = document.getElementById("loginPage");
const memberPage = document.getElementById("memberPage");

window.registerUser = async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    await createUserWithEmailAndPassword(auth, email, password);

    alert("登録成功！");

  } catch(error) {

    alert(error.message);

  }

};

window.loginUser = async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(auth, email, password);

    alert("ログイン成功！");

  } catch(error) {

    alert(error.message);

  }

};

window.logoutUser = async () => {

  await signOut(auth);

};

onAuthStateChanged(auth, (user) => {

  if(user){

    loginPage.style.display = "none";
    memberPage.style.display = "flex";

  } else {

    loginPage.style.display = "flex";
    memberPage.style.display = "none";

  }

});
