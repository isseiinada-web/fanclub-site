import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
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

function generateMemberNumber() {
  return Math.floor(100000 + Math.random() * 900000);
}

function getRank(months) {
  if (months >= 24) return "王";
  if (months >= 12) return "騎士";
  return "村人";
}

function getMonthsSince(dateString) {
  const start = new Date(dateString);
  const now = new Date();

  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  );
}

function updateUI(userData) {
  document.getElementById("memberName").textContent =
    userData.nickname || "User";

  document.getElementById("memberNo").textContent =
    userData.memberNumber;

  document.getElementById("sideMemberNo").textContent =
    "No." + userData.memberNumber;

  document.getElementById("memberSince").textContent =
    "SINCE " + userData.registerDate;

  document.getElementById("rankText").textContent =
    userData.rank;

  document.getElementById("profileImage").src =
    userData.avatarUrl;

  document.getElementById("profilePreview").src =
    userData.avatarUrl;

  document.getElementById("rankBadge").textContent =
    userData.rank;

  document.getElementById("yearBadge").textContent =
    userData.yearLabel;

  document.getElementById("nextRankText").textContent =
    userData.nextRank;

  document.getElementById("nicknameInput").value =
    userData.nickname;

  document.getElementById("avatarInput").value =
    userData.avatarUrl;
}

window.registerUser = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const result =
      await createUserWithEmailAndPassword(
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
      yearLabel: "1年目"
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
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
  } catch (error) {
    alert(error.message);
  }
};

window.logoutUser = async () => {
  await signOut(auth);
};

window.resetPassword = async () => {
  const email = document.getElementById("email").value;

  if (!email) {
    alert("メールアドレスを入力してください");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("再設定メールを送信しました");
  } catch (error) {
    alert(error.message);
  }
};

window.saveProfile = async () => {
  const user = auth.currentUser;

  if (!user) return;

  const nickname =
    document.getElementById("nicknameInput").value;

  const avatarUrl =
    document.getElementById("avatarInput").value;

  const current =
    JSON.parse(localStorage.getItem(user.uid));

  const updated = {
    ...current,
    nickname,
    avatarUrl
  };

  localStorage.setItem(
    user.uid,
    JSON.stringify(updated)
  );

  updateUI(updated);

  alert("プロフィール保存完了");
};

window.showPanel = (name) => {
  document
    .querySelectorAll(".screen-panel")
    .forEach((panel) => {
      panel.classList.remove("active-panel");
    });

  document
    .querySelectorAll(".nav-card")
    .forEach((card) => {
      card.classList.remove("active");
    });

  const panel =
    document.getElementById(`panel-${name}`);

  if (panel) {
    panel.classList.add("active-panel");
  }

  const nav =
    document.querySelector(`[data-panel="${name}"]`);

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
        yearLabel: "1年目"
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
