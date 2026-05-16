import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyA43kfNncTrEKhedVSunTReZQvPzMTkHj0",
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

const authMessage = document.getElementById("authMessage");


function generateMemberNumber() {

  return Math.floor(100000 + Math.random() * 900000);

}


function showMemberPage(user) {

  const number = generateMemberNumber();

  const today = new Date();

  const yyyy = today.getFullYear();

  const mm = String(today.getMonth() + 1).padStart(2, "0");

  const dd = String(today.getDate()).padStart(2, "0");

  const dateText = `${yyyy}.${mm}.${dd}`;


  loginPage.classList.add("hidden");

  memberPage.classList.remove("hidden");


  document.getElementById("memberName").innerText =
    user.email.split("@")[0];

  document.getElementById("memberNumber").innerText =
    number;

  document.getElementById("miniNumber").innerText =
    `No.${number}`;

  document.getElementById("sideNumber").innerText =
    `No.${number}`;

  document.getElementById("sinceDate").innerText =
    `SINCE ${dateText}`;

  document.getElementById("fanId").innerText =
    `FAN CLUB ID FC-${number}`;

}


window.registerUser = async () => {

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  try {

    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    authMessage.innerText = error.message;

  }

};


window.loginUser = async () => {

  const email = document.getElementById("email").value;

  const password = document.getElementById("password").value;

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    authMessage.innerText = error.message;

  }

};


window.resetPassword = async () => {

  const email = document.getElementById("email").value;

  if (!email) {

    authMessage.innerText =
      "メールアドレスを入力してください";

    return;

  }

  try {

    await sendPasswordResetEmail(auth, email);

    authMessage.innerText =
      "リセットメールを送信しました";

  } catch (error) {

    authMessage.innerText = error.message;

  }

};


window.logoutUser = async () => {

  await signOut(auth);

};


onAuthStateChanged(auth, (user) => {

  if (user) {

    showMemberPage(user);

  } else {

    loginPage.classList.remove("hidden");

    memberPage.classList.add("hidden");

  }

});
