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

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
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
const storage = getStorage(app);
const db = getFirestore(app);

const $ = (id) => document.getElementById(id);

const loginPage = $("loginPage");
const memberPage = $("memberPage");
const authMessage = $("authMessage");
const saveMessage = $("saveMessage");
const noticePostMessage = $("noticePostMessage");

let currentProfile = null;
let unsubscribeNotices = null;

function setMessage(text) {
  if (authMessage) authMessage.textContent = text;
}

function setSaveMessage(text) {
  if (saveMessage) saveMessage.textContent = text;
}

function setNoticePostMessage(text) {
  if (noticePostMessage) noticePostMessage.textContent = text;
}

function todayText() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function formatDateFromTimestamp(value) {
  if (!value) return "";

  if (value.toDate) {
    const d = value.toDate();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}.${mm}.${dd}`;
  }

  return String(value);
}

function calculateMembership(registerDate) {
  const start = registerDate ? new Date(String(registerDate).replaceAll(".", "/")) : new Date();
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

function safeSet(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function safeValue(id, value) {
  const el = $(id);
  if (el) el.value = value;
}

function safeSrc(id, src) {
  const el = $(id);
  if (el) el.src = src;
}

function updateUI(profile, user) {
  currentProfile = profile;

  const membership = calculateMembership(profile.registerDate);

  const nickname = profile.nickname || "member";
 const number =
  profile.role === "admin"
    ? "ADMIN"
    : String(profile.memberNumber || 1).padStart(6, "0");
  const avatarUrl = profile.avatarUrl || "./villager-icon.jpg";

  safeSet("memberName", nickname);
  safeSet("memberNumber", number);
  safeSet("registerDate", `SINCE ${profile.registerDate}`);
  safeSet("fanClubId", `FAN CLUB ID　FC-${number}`);
  safeSrc("avatarImage", avatarUrl);

  safeSet("memberRank", membership.rank);
  safeSet("yearLabel", membership.yearLabel);

  safeSet("rankText", membership.rank);
  safeSet("sideYear", membership.yearLabel);
  if (profile.role === "admin") {
  safeSet("sideBigNumber", "ADMIN");
  safeSet("topMemberNo", "ADMIN");
  safeSet("profileMemberNo", "ADMIN");
} else {
  safeSet("sideBigNumber", `No.${number}`);
  safeSet("topMemberNo", `No.${number}`);
  safeSet("profileMemberNo", `No.${number}`);
}

safeSet("nextRank", membership.nextText);


  safeSet("profileEmail", user?.email || "-");
  safeSet("profileNickname", nickname);
  safeSet("profileMemberNo", `No.${number}`);
  safeSet("profileCreatedAt", profile.registerDate);

  safeSet("statusRank", membership.rank);
  safeSet("statusDuration", membership.durationText);
  safeSet("statusNext", membership.nextText);
  safeSet("progressCurrent", membership.rank);
  safeSet("progressNext", membership.nextRank);

  const progressFill = $("progressFill");
  if (progressFill) progressFill.style.width = `${membership.progress}%`;

  safeValue("nicknameInput", nickname);
}

async function createProfileIfNeeded(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  }

  const counterRef = doc(db, "system", "memberCounter");
  const registerDate = todayText();
  const isAdmin = user.email === ADMIN_EMAIL;

  const profile = await runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterRef);
    const current = counterSnap.exists() ? Number(counterSnap.data().current || 0) : 0;

    let nextNumber = current;

    if (!isAdmin) {
      nextNumber = current + 1;
      
    }

    const newProfile = {
      uid: user.uid,
      email: user.email,
      nickname: user.email.split("@")[0],
      memberNumber: isAdmin ? "ADMIN" : nextNumber,
      registerDate,
      avatarUrl: "./villager-icon.jpg",
      role: user.email === ADMIN_EMAIL ? "admin" : "member",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    transaction.set(counterRef, { current: nextNumber }, { merge: true });
    transaction.set(userRef, newProfile);

    return newProfile;
  });

  return profile;
}

function renderNotices(docs) {
  const noticeList = $("noticeList");
  const noticeBadge = $("noticeBadge");
  const noticeCount = $("noticeCount");

  if (!noticeList) return;

  if (noticeBadge) noticeBadge.textContent = docs.length;
  if (noticeCount) noticeCount.textContent = `${docs.length}件`;

  if (docs.length === 0) {
    noticeList.innerHTML = `
      <article class="notice-card">
        <span class="notice-label">INFO</span>
        <h4>まだお知らせはありません</h4>
        <p>新しいお知らせが投稿されるとここに表示されます。</p>
      </article>
    `;
    return;
  }

  noticeList.innerHTML = docs.map((notice, index) => {
    const label = index === 0 ? "最新" : "お知らせ";
    const importantClass = index === 0 ? " important" : "";
    const dateText = formatDateFromTimestamp(notice.createdAt);

    return `
      <article class="notice-card${importantClass}">
        <span class="notice-label">${label}</span>
        <h4>${escapeHtml(notice.title || "無題のお知らせ")}</h4>
        <p>${escapeHtml(notice.body || "")}</p>
        <small>${dateText || ""}</small>
      </article>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function startNoticeListener() {
  if (unsubscribeNotices) unsubscribeNotices();

  const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));

  unsubscribeNotices = onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    renderNotices(docs);
  }, (error) => {
    console.error(error);
  });
}

function updateAdminUI(user) {
  const adminNoticeBox = $("adminNoticeBox");
  if (!adminNoticeBox) return;

  if (user && user.email === ADMIN_EMAIL) {
    adminNoticeBox.classList.remove("hidden");
  } else {
    adminNoticeBox.classList.add("hidden");
  }
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
    await createProfileIfNeeded(result.user);
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

  let avatarUrl = currentProfile?.avatarUrl || "./villager-icon.jpg";

  try {
    setSaveMessage("保存中...");

    if (file) {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      avatarUrl = await getDownloadURL(storageRef);
    }

    const updated = {
      ...currentProfile,
      nickname,
      avatarUrl,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "users", user.uid), updated);

    const latestSnap = await getDoc(doc(db, "users", user.uid));
    const latestProfile = latestSnap.data();

    updateUI(latestProfile, user);
    setSaveMessage("保存しました");
    alert("プロフィール保存完了");
  } catch (error) {
    setSaveMessage(error.message);
    alert(error.message);
  }
};

window.postNotice = async () => {
  const user = auth.currentUser;

  if (!user || currentProfile?.role !== "admin") {
    alert("管理者のみ投稿できます。");
    return;
  }

  const title = $("noticeTitleInput").value.trim();
  const body = $("noticeBodyInput").value.trim();

  if (!title || !body) {
    setNoticePostMessage("タイトルと本文を入力してください。");
    return;
  }

  try {
    setNoticePostMessage("投稿中...");

    await addDoc(collection(db, "notices"), {
      title,
      body,
      createdAt: serverTimestamp(),
      createdBy: user.uid,
      createdByEmail: user.email
    });

    $("noticeTitleInput").value = "";
    $("noticeBodyInput").value = "";
    setNoticePostMessage("投稿しました");
  } catch (error) {
    setNoticePostMessage(error.message);
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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    memberPage.classList.remove("hidden");

    const profile = await createProfileIfNeeded(user);
    updateUI(profile, user);
    updateAdminUI(user);
    startNoticeListener();
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
    updateAdminUI(null);

    if (unsubscribeNotices) {
      unsubscribeNotices();
      unsubscribeNotices = null;
    }
  }
});
window.searchMembers = async () => {

  const keyword = $("memberSearchInput").value.trim().toLowerCase();

  const memberList = $("memberList");

  memberList.innerHTML = "検索中...";

  try {

    const snap = await getDocs(collection(db, "users"));

    let html = "";

    let total = 0;
    let banned = 0;

    snap.forEach((docSnap) => {

      total++;

      const user = docSnap.data();

      if (user.banned) {
        banned++;
      }

      const searchTarget = `
        ${user.email || ""}
        ${user.nickname || ""}
        ${user.uid || ""}
      `.toLowerCase();

      if (!searchTarget.includes(keyword)) {
        return;
      }

      html += `
        <div class="member-card">
          <p><strong>${user.nickname || "未設定"}</strong></p>
          <p>${user.email || ""}</p>
          <p>UID: ${user.uid || ""}</p>
          <p>ランク: ${user.rank || "村人"}</p>
          <p>権限: ${user.role || "member"}</p>
          <p>BAN: ${user.banned ? "ON" : "OFF"}</p>

          <button onclick="toggleBan('${user.uid}', ${user.banned ? "false" : "true"})">
            ${user.banned ? "BAN解除" : "BANする"}
          </button>

          <button onclick="makeAdmin('${user.uid}')">
            管理者化
          </button>
        </div>
      `;

    });

    $("totalMembers").textContent = total;
    $("bannedMembers").textContent = banned;

    if (!html) {
      html = "該当ユーザーなし";
    }

    memberList.innerHTML = html;

  } catch (error) {

    console.error(error);

    memberList.innerHTML = error.message;

  }

};

window.toggleBan = async (uid, banned) => {

  try {

    await updateDoc(doc(db, "users", uid), {
      banned
    });

    alert(banned ? "BANしました" : "BAN解除しました");

    searchMembers();

  } catch (error) {

    alert(error.message);

  }

};

window.makeAdmin = async (uid) => {

  try {

    await updateDoc(doc(db, "users", uid), {
      role: "admin"
    });

    alert("管理者に変更しました");

    searchMembers();

  } catch (error) {

    alert(error.message);

  }

};
