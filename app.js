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
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
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

const $ = (id) => document.getElementById(id);

const loginPage = $("loginPage");
const memberPage = $("memberPage");
const authMessage = $("authMessage");

function setMessage(message) {
  if (authMessage) authMessage.textContent = message;
}

function formatMemberNumber(number) {
  return String(number || 1).padStart(6, "0");
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function getMembershipInfo(createdAt) {
  const start = createdAt ? new Date(createdAt) : new Date();
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth());
  const years = Math.floor(months / 12) + 1;

  let rank = "村人";
  let next = "あと3ヶ月";

  if (months >= 36) {
    rank = "国民";
    next = "最高ランク";
  } else if (months >= 24) {
    rank = "住民";
    next = `あと${36 - months}ヶ月`;
  } else if (months >= 12) {
    rank = "市民";
    next = `あと${24 - months}ヶ月`;
  } else {
    rank = "村人";
    next = `あと${Math.max(1, 12 - months)}ヶ月`;
  }

  return {
    rank,
    yearsText: `${years}年目`,
    next
  };
}

function updateUI(user, profile) {
  const memberNumber = formatMemberNumber(profile.memberNumber);
  const createdAt = profile.createdAt || new Date().toISOString();
  const membership = getMembershipInfo(createdAt);
  const nickname = profile.nickname || user.email?.split("@")[0] || "member";

  $("cardName").textContent = nickname;
  $("memberNumber").textContent = memberNumber;
  $("cardNumber").textContent = memberNumber;
  $("fanclubId").textContent = `FC-${memberNumber}`;
  $("sinceText").textContent = `SINCE ${formatDate(createdAt)}`;

  $("cardRank").textContent = membership.rank;
  $("cardYear").textContent = membership.yearsText;

  $("sideRank").textContent = membership.rank;
  $("sideNumber").textContent = `No.${memberNumber}`;
  $("sideNext").textContent = membership.next;
  $("sideYearBadge").textContent = membership.yearsText;
  $("headerNumber").textContent = `No.${memberNumber}`;

  $("profileEmail").textContent = user.email || "-";
  $("profileName").textContent = nickname;
  $("profileNumber").textContent = `No.${memberNumber}`;

  $("statusRankInline").textContent = membership.rank;
  $("statusYearInline").textContent = membership.yearsText;
  $("statusNextInline").textContent = membership.next;
}

async function ensureUserProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  }

  const createdAt = new Date().toISOString();
  const memberNumber = Math.floor(Math.random() * 900000) + 1;
  const profile = {
    uid: user.uid,
    email: user.email,
    nickname: user.email?.split("@")[0] || "member",
    memberNumber,
    createdAt,
    rank: "村人",
    createdServerAt: serverTimestamp()
  };

  await setDoc(ref, profile);
  return profile;
}

window.registerUser = async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    setMessage("メールアドレスとパスワードを入力してください。");
    return;
  }

  try {
    setMessage("登録中...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserProfile(result.user);
    setMessage("登録成功！");
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
    setMessage("パスワード再設定にはメールアドレスを入力してください。");
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

window.showPanel = (name) => {
  document.querySelectorAll(".content-panel").forEach((panel) => {
    panel.classList.remove("active-panel");
  });

  document.querySelectorAll(".menu-card").forEach((button) => {
    button.classList.remove("active");
  });

  const panel = $(`panel-${name}`);
  if (panel) panel.classList.add("active-panel");

  const buttons = Array.from(document.querySelectorAll(".menu-card"));
  const target = buttons.find((button) => button.getAttribute("onclick")?.includes(name));
  if (target) target.classList.add("active");
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    memberPage.classList.remove("hidden");
    memberPage.style.display = "block";

    const profile = await ensureUserProfile(user);
    updateUI(user, profile);
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
  }
});
