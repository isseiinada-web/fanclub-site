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

// テスト用
window.testRegister = async () => {
  try {
    const user = await createUserWithEmailAndPassword(
      auth,
      "test@test.com",
      "123456"
    );

    console.log("登録成功", user);
  } catch (error) {
    console.log(error);
  }
};

window.testLogin = async () => {
  try {
    const user = await signInWithEmailAndPassword(
      auth,
      "test@test.com",
      "123456"
    );

    console.log("ログイン成功", user);
  } catch (error) {
    console.log(error);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("ログイン中", user.email);
  } else {
    console.log("未ログイン");
  }
});

testRegister();
