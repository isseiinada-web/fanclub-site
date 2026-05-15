// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyA43kfNncTrEKhedVSunTReZQvPzMTkHj0",
  authDomain: "brothers-fanclub.firebaseapp.com",
  projectId: "brothers-fanclub",
  storageBucket: "brothers-fanclub.firebasestorage.app",
  messagingSenderId: "818864836252",
  appId: "1:818864836252:web:a5fe021cb0a97c6877e759",
  measurementId: "G-KBM70KG1DH"
};

// 初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase Connected");

window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const user = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("登録成功", user);
    alert("会員登録成功！");
  } catch (error) {
    console.log(error);
    alert(error.message);
  }
};

window.loginUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const user = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    console.log("ログイン成功", user);
    alert("ログイン成功！");
  } catch (error) {
    console.log(error);
    alert(error.message);
  }
};
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("ログイン中", user.email);
  } else {
    console.log("未ログイン");
  }
});

window.auth = auth;

const memberPage = document.getElementById("memberPage");

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("ログイン中", user.email);

    memberPage.style.display = "flex";
  } else {
    console.log("未ログイン");

    memberPage.style.display = "none";
  }
});
