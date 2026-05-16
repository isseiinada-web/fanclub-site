import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const db = getFirestore(app);

const loginPage = document.getElementById("loginPage");
const memberPage = document.getElementById("memberPage");

const authMessage = document.getElementById("authMessage");

window.registerUser = async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {

    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = result.user.uid;

    const memberNo = Math.floor(
      100000 + Math.random() * 900000
    );

    await setDoc(doc(db, "users", uid), {
      nickname: email.split("@")[0],
      memberNo: memberNo,
      rank: "村人",
      createdAt: new Date().toISOString()
    });

    authMessage.innerText = "新規登録成功";
    authMessage.style.color = "#22c55e";

  } catch (error) {

    authMessage.innerText = error.message;
    authMessage.style.color = "#ef4444";

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

    authMessage.innerText = "ログイン成功";
    authMessage.style.color = "#22c55e";

  } catch (error) {

    authMessage.innerText = error.message;
    authMessage.style.color = "#ef4444";

  }

};

window.resetPassword = async () => {

  const email = document.getElementById("email").value;

  if (!email) {
    authMessage.innerText = "メールアドレス入力";
    authMessage.style.color = "#ef4444";
    return;
  }

  try {

    await sendPasswordResetEmail(auth, email);

    authMessage.innerText = "リセットメール送信";
    authMessage.style.color = "#22c55e";

  } catch (error) {

    authMessage.innerText = error.message;
    authMessage.style.color = "#ef4444";

  }

};

window.logoutUser = async () => {
  await signOut(auth);
};

onAuthStateChanged(auth, async (user) => {

  if (user) {

    loginPage.style.display = "none";
    memberPage.style.display = "flex";

    const snap = await getDoc(
      doc(db, "users", user.uid)
    );

    if (snap.exists()) {

      const data = snap.data();

      document.getElementById("displayName").innerText =
        data.nickname;

      document.getElementById("memberNumber").innerText =
        data.memberNo;

      document.getElementById("rankText").innerText =
        data.rank;

    }

  } else {

    loginPage.style.display = "flex";
    memberPage.style.display = "none";

  }

});
