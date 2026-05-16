import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
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

const memberName = document.getElementById("memberName");
const memberNumber = document.getElementById("memberNumber");
const registerDate = document.getElementById("registerDate");
const memberRank = document.getElementById("memberRank");
const nextRank = document.getElementById("nextRank");
const yearLabel = document.getElementById("yearLabel");
const avatarImage = document.getElementById("avatarImage");

function generateMemberNumber() {
  const count =
    Number(localStorage.getItem("fan-club-demo-member-count") || "0") + 1;

  localStorage.setItem("fan-club-demo-member-count", count);

  return String(count).padStart(6, "0");
}

function updateUI(profile) {
  memberName.textContent = profile.nickname;
  memberNumber.textContent = profile.memberNumber;
  registerDate.textContent = profile.registerDate;
  memberRank.textContent = profile.rank;
  nextRank.textContent = profile.nextRank;
  yearLabel.textContent = profile.yearLabel;

  avatarImage.src = profile.avatarUrl;
}

window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (password.length < 6) {
    alert("パスワードは6文字以上です");
    return;
  }

  try {
    const result = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const today = new Date();

    const dateString =
      `${today.getFullYear()}.${String(
        today.getMonth() + 1
      ).padStart(2, "0")}.${String(
        today.getDate()
      ).padStart(2, "0")}`;

    const profile = {
      nickname: email.split("@")[0],
      memberNumber: generateMemberNumber(),
      registerDate: dateString,

      avatarUrl: "./villager-icon.jpg",

      rank: "村人",
      nextRank: "あと3ヶ月",
      yearLabel: "1年目",
    };

    localStorage.setItem(
      result.user.uid,
      JSON.stringify(profile)
    );

    alert("会員登録完了");
  } catch (error) {
    alert(error.message);
  }
};

window.loginUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    authMessage.textContent = "ログイン成功";
  } catch (error) {
    alert(error.message);
  }
};

window.logoutUser = async () => {
  await signOut(auth);
};

window.resetPassword = () => {
  alert("今後追加予定");
};

window.showPanel = (name) => {
  document.querySelectorAll(".screen-panel").forEach((panel) => {
    panel.classList.remove("active-panel");
  });

  document.querySelectorAll(".nav-card").forEach((button) => {
    button.classList.remove("active");
  });

  const panel = document.getElementById(`panel-${name}`);

  if (panel) {
    panel.classList.add("active-panel");
  }

  const nav = document.querySelector(`[data-panel="${name}"]`);

  if (nav) {
    nav.classList.add("active");
  }
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    memberPage.classList.remove("hidden");

    let profile =
      JSON.parse(localStorage.getItem(user.uid));

    if (!profile) {
      profile = {
        nickname: user.email.split("@")[0],
        memberNumber: generateMemberNumber(),
        registerDate: "2026.05.16",

        avatarUrl: "./villager-icon.jpg",

        rank: "村人",
        nextRank: "あと3ヶ月",
        yearLabel: "1年目",
      };

      localStorage.setItem(
        user.uid,
        JSON.stringify(profile)
      );
    }

    updateUI(profile);
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
  }
});
