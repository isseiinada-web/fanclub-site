import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

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
const storage = getStorage(app);

const $ = (id) => document.getElementById(id);

const loginPage = $("loginPage");
const memberPage = $("memberPage");
const authMessage = $("authMessage");
const saveMessage = $("saveMessage");

function setMessage(text) {
  if (authMessage) authMessage.textContent = text;
}

function setSaveMessage(text) {
  if (saveMessage) saveMessage.textContent = text;
}

function generateMemberNumber() {
  const count = Number(localStorage.getItem("fan-club-demo-member-count") || "0") + 1;
  localStorage.setItem("fan-club-demo-member-count", count);
  return String(count).padStart(6, "0");
}

function todayText() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function calculateMembership(registerDate) {
  const start = registerDate ? new Date(registerDate.replaceAll(".", "/")) : new Date();
  const now = new Date();

  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  const ranks = [
    { name: "村人", month: 0 },
    { name: "見習い", month: 3 },
    { name: "かけだし", month: 6 },
    { name: "冒険者", month: 9 },
    { name: "1年メンバー", month: 12 },
    { name: "古参ファン", month: 36 }
  ];

  let current = ranks[0];
  let next = ranks[1];

  for (let i = 0; i < ranks.length; i++) {
    if (months >= ranks[i].month) {
      current = ranks[i];
      next = ranks[i + 1] || null;
    }
  }

  const years = Math.floor(months / 12) + 1;
  const yearLabel = `${years}年目`;
  const durationText = months >= 12 ? `${Math.floor(months / 12)}年${months % 12}ヶ月` : `${months}ヶ月`;

  let nextText = "最高ランク";
  let progress = 100;

  if (next) {
    const remain = next.month - months;
    nextText = `あと${Math.max(1, remain)}ヶ月`;
    const range = next.month - current.month;
    const passed = months - current.month;
    progress = Math.max(0, Math.min(100, Math.round((passed / range) * 100)));
  }

  return {
    rank: current.name,
    nextRank: next ? next.name : "MAX",
    nextText,
    progress,
    yearLabel,
    durationText
  };
}

function updateUI(profile, user) {
  const membership = calculateMembership(profile.registerDate);

  const nickname = profile.nickname || "member";
  const number = profile.memberNumber || "000001";
  const avatarUrl = profile.avatarUrl || "./villager-icon.jpg";

  $("memberName").textContent = nickname;
  $("memberNumber").textContent = number;
  $("registerDate").textContent = `SINCE ${profile.registerDate}`;
  $("fanClubId").textContent = `FAN CLUB ID　FC-${number}`;
  $("avatarImage").src = avatarUrl;

  $("memberRank").textContent = membership.rank;
  $("yearLabel").textContent = membership.yearLabel;

  $("rankText").textContent = membership.rank;
  $("sideYear").textContent = membership.yearLabel;
  $("sideBigNumber").textContent = `No.${number}`;
  $("nextRank").textContent = membership.nextText;
  $("topMemberNo").textContent = `No.${number}`;

  $("profileEmail").textContent = user?.email || "-";
  $("profileNickname").textContent = nickname;
  $("profileMemberNo").textContent = `No.${number}`;
  $("profileCreatedAt").textContent = profile.registerDate;

  $("statusRank").textContent = membership.rank;
  $("statusDuration").textContent = membership.durationText;
  $("statusNext").textContent = membership.nextText;
  $("progressCurrent").textContent = membership.rank;
  $("progressNext").textContent = membership.nextRank;
  $("progressFill").style.width = `${membership.progress}%`;

  $("nicknameInput").value = nickname;
}

function makeDefaultProfile(user) {
  return {
    nickname: user.email.split("@")[0],
    memberNumber: generateMemberNumber(),
    registerDate: todayText(),
    avatarUrl: "./villager-icon.jpg"
  };
}

window.registerUser = async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    setMessage("メールアドレスとパスワードを入力してください。");
    return;
  }

  if (password.length < 6) {
    setMessage("パスワードは6文字以上です。");
    return;
  }

  try {
    setMessage("登録中...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const profile = makeDefaultProfile(result.user);
    localStorage.setItem(result.user.uid, JSON.stringify(profile));
    setMessage("会員登録完了");
  } catch (error) {
    setMessage(error.message);
    alert(error.message);
  }
};

window.loginUser = async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    setMessage("メールアドレスとパスワードを入力してください。");
    return;
  }

  try {
    setMessage("ログイン中...");
    await signInWithEmailAndPassword(auth, email, password);
    setMessage("");
  } catch (error) {
    setMessage(error.message);
    alert(error.message);
  }
};

window.logoutUser = async () => {
  await signOut(auth);
};

window.resetPassword = async () => {
  const email = $("email").value.trim();

  if (!email) {
    setMessage("メールアドレスを入力してください。");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    setMessage("パスワード再設定メールを送信しました。");
  } catch (error) {
    setMessage(error.message);
    alert(error.message);
  }
};

window.saveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const nickname = $("nicknameInput").value.trim() || user.email.split("@")[0];
  const file = $("avatarUpload").files[0];

  let current = JSON.parse(localStorage.getItem(user.uid));
  if (!current) current = makeDefaultProfile(user);

  let avatarUrl = current.avatarUrl || "./villager-icon.jpg";

  try {
    setSaveMessage("保存中...");

    if (file) {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      avatarUrl = await getDownloadURL(storageRef);
    }

    const updated = {
      ...current,
      nickname,
      avatarUrl
    };

    localStorage.setItem(user.uid, JSON.stringify(updated));
    updateUI(updated, user);
    setSaveMessage("保存しました");
    alert("プロフィール保存完了");
  } catch (error) {
    setSaveMessage(error.message);
    alert(error.message);
  }
};

window.showPanel = (name) => {
  document.querySelectorAll(".screen-panel").forEach((panel) => {
    panel.classList.remove("active-panel");
  });

  document.querySelectorAll(".nav-card").forEach((button) => {
    button.classList.remove("active");
  });

  const panel = $(`panel-${name}`);
  if (panel) panel.classList.add("active-panel");

  const nav = document.querySelector(`[data-panel="${name}"]`);
  if (nav) nav.classList.add("active");
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    memberPage.classList.remove("hidden");

    let profile = JSON.parse(localStorage.getItem(user.uid));

    if (!profile) {
      profile = makeDefaultProfile(user);
      localStorage.setItem(user.uid, JSON.stringify(profile));
    }

    updateUI(profile, user);
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
  }
});
