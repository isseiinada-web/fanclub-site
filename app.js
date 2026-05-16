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

  if (months >= 36) {
    return { rank: "国民", yearsText: `${years}年目`, next: "最高ランク" };
  }

  if (months >= 24) {
    return { rank: "住民", yearsText: `${years}年目`, next: `あと${36 - months}ヶ月` };
  }

  if (months >= 12) {
    return { rank: "市民", yearsText: `${years}年目`, next: `あと${24 - months}ヶ月` };
  }

  return { rank: "村人", yearsText: `${years}年目`, next: `あと${Math.max(1, 12 - months)}ヶ月` };
}

function safeSet(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}

function updateUI(user, profile) {
  const memberNumber = formatMemberNumber(profile.memberNumber);
  const createdAt = profile.createdAt || new Date().toISOString();
  const membership = getMembershipInfo(createdAt);
  const nickname = profile.nickname || user.email?.split("@")[0] || "member";

  safeSet("cardName", nickname);
  safeSet("cardNumber", memberNumber);
  safeSet("fanClubId", `FAN CLUB ID　FC-${memberNumber}`);
  safeSet("sinceDate", `SINCE ${formatDate(createdAt)}`);

  safeSet("cardRank", membership.rank);
  safeSet("cardYear", membership.yearsText);

  safeSet("sideRank", membership.rank);
  safeSet("sideMemberNo", `No.${memberNumber}`);
  safeSet("sideNext", membership.next);
  safeSet("sideYear", membership.yearsText);
  safeSet("topMemberNo", `No.${memberNumber}`);

  safeSet("profileEmail", user.email || "-");
  safeSet("profileNickname", nickname);
  safeSet("profileMemberNo", `No.${memberNumber}`);
  safeSet("profileCreatedAt", formatDate(createdAt));
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
  document.querySelectorAll(".info-panel").forEach((panel) => {
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

    const profile = await ensureUserProfile(user);
    updateUI(user, profile);
  } else {
    loginPage.classList.remove("hidden");
    memberPage.classList.add("hidden");
  }
});
```

## 追加アップデートコード

### app.js に追加

```javascript
const editNameInput = document.getElementById("editName");
const saveProfileBtn = document.getElementById("saveProfile");
const profileImageInput = document.getElementById("profileImageInput");

if (saveProfileBtn) {
  saveProfileBtn.onclick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const newName = editNameInput.value;

    await updateDoc(doc(db, "users", user.uid), {
      nickname: newName
    });

    document.getElementById("displayName").innerText = newName;

    alert("プロフィール更新完了");
  };
}

if (profileImageInput) {
  profileImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      document.getElementById("profileImage").src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
```

### index.html に追加

```html
<div class="settings-card">
  <h2>プロフィール編集</h2>

  <input
    id="editName"
    type="text"
    placeholder="ニックネーム"
    class="settings-input"
  />

  <input
    id="profileImageInput"
    type="file"
    accept="image/*"
    class="settings-input"
  />

  <button id="saveProfile" class="save-btn">
    保存する
  </button>
</div>
```

### style.css に追加

```css
.settings-card {
  margin-top: 30px;
  background: white;
  border-radius: 28px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}

.settings-card h2 {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 20px;
}

.settings-input {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #ddd;
  margin-bottom: 16px;
  font-size: 16px;
}

.save-btn {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(90deg,#7c4dff,#9b6bff);
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 900px) {
  .main-layout {
    flex-direction: column;
    padding: 16px;
  }

  .left-menu,
  .right-status {
    width: 100%;
  }

  .member-card {
    padding: 30px;
  }

  .digital-title {
    font-size: 60px;
    line-height: 0.95;
  }

  .member-number {
    font-size: 72px;
  }

  .profile-image {
    width: 180px;
    height: 180px;
  }
}
window.loginUser = async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const authMessage = document.getElementById("authMessage");

  try {

    await signInWithEmailAndPassword(auth, email, password);

    authMessage.innerText = "ログイン成功";
    authMessage.style.color = "#22c55e";

  } catch (error) {

    authMessage.innerText = error.message;
    authMessage.style.color = "#ef4444";

  }

};
