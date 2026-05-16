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
  updateDoc,
  runTransaction,
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
const saveMessage = $("saveMessage");

function setMessage(message) {
  if (authMessage) authMessage.textContent = message;
}

function setSaveMessage(message) {
  if (saveMessage) saveMessage.textContent = message;
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

function calculateMembership(createdAt) {
  const start = createdAt ? new Date(createdAt) : new Date();
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonthLastDate = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += previousMonthLastDate;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = Math.max(0, years * 12 + months);

  const ranks = [
    { name: "村人", months: 0 },
    { name: "見習い", months: 3 },
    { name: "かけだし", months: 6 },
    { name: "冒険者", months: 9 },
    { name: "1年メンバー", months: 12 },
    { name: "2年メンバー", months: 24 },
    { name: "古参ファン", months: 36 },
    { name: "レジェンド", months: 48 },
    { name: "超古参", months: 60 }
  ];

  let current = ranks[0];
  let next = null;

  for (let i = 0; i < ranks.length; i += 1) {
    if (totalMonths >= ranks[i].months) {
      current = ranks[i];
      next = ranks[i + 1] || null;
    }
  }

  let nextText = "最高ランク";
  let progress = 100;

  if (next) {
    const range = Math.max(1, next.months - current.months);
    const passed = totalMonths - current.months;
    progress = Math.min(100, Math.max(0, Math.round((passed / range) * 100)));
    const remain = Math.max(0, next.months - totalMonths);
    const remainYears = Math.floor(remain / 12);
    const remainMonths = remain % 12;

    if (remainYears > 0 && remainMonths > 0) {
      nextText = `あと${remainYears}年${remainMonths}ヶ月`;
    } else if (remainYears > 0) {
      nextText = `あと${remainYears}年`;
    } else {
      nextText = `あと${Math.max(1, remainMonths)}ヶ月`;
    }
  }

  return {
    rank: current.name,
    nextRank: next ? next.name : "MAX",
    nextText,
    progress,
    yearsText: years >= 1 ? `${years}年目` : "1年目",
    durationText: years > 0 ? `${years}年${months}ヶ月` : `${months}ヶ月${days}日`
  };
}

function safeSet(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function safeValue(id, value) {
  const element = $(id);
  if (element) element.value = value;
}

function safeSrc(id, value) {
  const element = $(id);
  if (element && value) element.src = value;
}

function updateUI(user, profile) {
  const memberNumber = formatMemberNumber(profile.memberNumber || profile.memberNo || 1);
  const createdAt = profile.createdAt || new Date().toISOString();
  const membership = calculateMembership(createdAt);
  const nickname = profile.nickname || user.email?.split("@")[0] || "member";
  const avatarUrl = profile.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop";

  safeSet("cardName", nickname);
  safeSet("cardNumber", memberNumber);
  safeSet("fanClubId", `FAN CLUB ID　FC-${memberNumber}`);
  safeSet("sinceDate", `SINCE ${formatDate(createdAt)}`);

  safeSet("cardRank", membership.rank);
  safeSet("cardYear", membership.yearsText);

  safeSet("sideRank", membership.rank);
  safeSet("sideMemberNo", `No.${memberNumber}`);
  safeSet("sideNext", membership.nextText);
  safeSet("sideYear", membership.yearsText);
  safeSet("topMemberNo", `No.${memberNumber}`);

  safeSet("profileEmail", user.email || "-");
  safeSet("profileNickname", nickname);
  safeSet("profileMemberNo", `No.${memberNumber}`);
  safeSet("profileCreatedAt", formatDate(createdAt));

  safeSet("statusRankInline", membership.rank);
  safeSet("statusDurationInline", membership.durationText);
  safeSet("statusNextInline", membership.nextText);
  safeSet("progressCurrent", membership.rank);
  safeSet("progressNext", membership.nextRank);

  const progressFill = $("progressFill");
  if (progressFill) progressFill.style.width = `${membership.progress}%`;

  safeValue("editNickname", nickname);
  safeValue("editAvatarUrl", avatarUrl);
  safeSrc("avatarImage", avatarUrl);
}

async function createProfileIfNeeded(user) {
  const userRef = doc(db, "users", user.uid);
  const profileSnap = await getDoc(userRef);

  if (profileSnap.exists()) {
    return profileSnap.data();
  }

  const counterRef = doc(db, "system", "memberCounter");
  const today = new Date().toISOString();

  const profile = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? Number(counterSnap.data().current || 0) : 0;
    const nextNumber = current + 1;

    const newProfile = {
      uid: user.uid,
      email: user.email,
      nickname: user.email?.split("@")[0] || "member",
      memberNumber: nextNumber,
      avatarUrl: "./villager-icon.jpg"
      createdAt: today,
      updatedAt: today,
      createdServerAt: serverTimestamp()
    };

    transaction.set(counterRef, { current: nextNumber }, { merge: true });
    transaction.set(userRef, newProfile);

    return newProfile;
  });

  return profile;
}

window.registerUser = async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    setMessage("メールアドレスとパスワードを入力してください。");
    return;
  }

  if (password.length < 6) {
    setMessage("パスワードは6文字以上で入力してください。");
    return;
  }

  try {
    setMessage("登録中...");
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createProfileIfNeeded(result.user);
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

window.saveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  const nickname = $("editNickname").value.trim() || user.email?.split("@")[0] || "member";
  const avatarUrl = $("editAvatarUrl").value.trim();

  try {
    setSaveMessage("保存中...");
    await updateDoc(doc(db, "users", user.uid), {
      nickname,
      avatarUrl,
      updatedAt: new Date().toISOString()
    });

    const profile = await createProfileIfNeeded(user);
    const nextProfile = { ...profile, nickname, avatarUrl };
    updateUI(user, nextProfile);
    setSaveMessage("保存しました");
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

  const target = document.querySelector(`[data-panel="${name}"]`);
  if (target) target.classList.add("active");
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    memberPage.classList.remove("hidden");

    const profile = await createProfileIfNeeded(user);
    updateUI(user, profile);
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
  }
});
window.resetPassword = async () => {
  alert("パスワード再設定機能は後で追加予定です");
};
