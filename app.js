"use strict";

const BASE_URL = "https://api.freeapi.app/api/v1/users";

// Api endpoints added
const ENDPOINTS = {
  register: `${BASE_URL}/register`,
  login: `${BASE_URL}/login`,
  logout: `${BASE_URL}/logout`,
  currentUser: `${BASE_URL}/current-user`,
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function showScreen(name) {
  $$(".screen").forEach((s) => s.classList.remove("active"));
  const target = $(`screen-${name}`);
  if (target) target.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// toast
let toastTimer = null;

function showToast(message, type = "success") {
  const toast = $("toast");
  const msg = $("toast-msg");
  const icon = $("toast-icon");

  if (!toast || !msg) {
    return;
  }

  toast.className = `toast ${type}`;
  msg.textContent = message;
  if (icon) {
    icon.textContent = type === "success" ? "OK" : "X";
  }

  void toast.offsetWidth;
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
}

function setLoading(btn, loading) {
  const text = btn.querySelector(".btn-text");
  const loader = btn.querySelector(".btn-loader");
  btn.disabled = loading;
  text.hidden = loading;
  loader.hidden = !loading;
}

// form validation functions
function setErr(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
}

function clearErrs(...ids) {
  ids.forEach((id) => setErr(id, ""));
}

function validateLogin(username, password) {
  let ok = true;
  if (!username.trim()) {
    setErr("err-login-username", "Username is required.");
    ok = false;
  }
  if (!password) {
    setErr("err-login-password", "Password is required.");
    ok = false;
  }
  return ok;
}

function validateRegister(username, email, password) {
  let ok = true;
  if (!username.trim()) {
    setErr("err-reg-username", "Username is required.");
    ok = false;
  } else if (username.length < 3) {
    setErr("err-reg-username", "Min. 3 characters.");
    ok = false;
  }
  if (!email.trim()) {
    setErr("err-reg-email", "Email is required.");
    ok = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr("err-reg-email", "Enter a valid email.");
    ok = false;
  }
  if (!password) {
    setErr("err-reg-password", "Password is required.");
    ok = false;
  } else if (password.length < 8) {
    setErr("err-reg-password", "Min. 8 characters.");
    ok = false;
  }
  return ok;
}

// Token stored in localStorage
const TOKEN_KEY = "sakura_access_token";

function saveToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const config = {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  return { ok: response.ok, status: response.status, data };
}

// register
async function handleRegister(e) {
  e.preventDefault();

  const username = $("reg-username").value.trim();
  const email = $("reg-email").value.trim();
  const password = $("reg-password").value;
  const role = $("reg-role").value;

  clearErrs(
    "err-reg-username",
    "err-reg-email",
    "err-reg-password",
    "err-reg-role",
  );

  if (!validateRegister(username, email, password)) return;

  const btn = $("btn-register");
  setLoading(btn, true);

  try {
    const { ok, data } = await apiFetch(ENDPOINTS.register, {
      method: "POST",
      body: JSON.stringify({ username, email, password, role }),
    });

    if (ok) {
      showToast("Account created. Please sign in.", "success");
      $("form-register").reset();
      setTimeout(() => showScreen("login"), 800);
    } else {
      const msg = data?.message || "Registration failed. Please try again.";
      showToast(msg, "error");

      const lmsg = msg.toLowerCase();
      if (lmsg.includes("username")) setErr("err-reg-username", msg);
      else if (lmsg.includes("email")) setErr("err-reg-email", msg);
      else if (lmsg.includes("password")) setErr("err-reg-password", msg);
    }
  } catch {
    showToast("Network error. Check your connection.", "error");
  } finally {
    setLoading(btn, false);
  }
}

// login
async function handleLogin(e) {
  e.preventDefault();

  const username = $("login-username").value.trim();
  const password = $("login-password").value;

  clearErrs("err-login-username", "err-login-password");

  if (!validateLogin(username, password)) return;

  const btn = $("btn-login");
  setLoading(btn, true);

  try {
    const { ok, data } = await apiFetch(ENDPOINTS.login, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (ok) {
      const token = data?.data?.accessToken;
      saveToken(token);

      showToast("Welcome back. Signing you in...", "success");
      $("form-login").reset();
      showScreen("dashboard");
      loadCurrentUser();
    } else {
      const msg = data?.message || "Invalid credentials.";
      showToast(msg, "error");
      if (msg.toLowerCase().includes("password"))
        setErr("err-login-password", msg);
      else setErr("err-login-username", msg);
    }
  } catch {
    showToast("Network error. Check your connection.", "error");
  } finally {
    setLoading(btn, false);
  }
}

// LOGOUT
async function handleLogout() {
  const btn = $("btn-logout");
  setLoading(btn, true);

  try {
    await apiFetch(ENDPOINTS.logout, { method: "POST" });
  } catch {}

  clearToken();
  clearProfileUI();
  showToast("Logged out. See you soon.", "success");
  setTimeout(() => showScreen("login"), 600);
  setLoading(btn, false);
}

// CURRENT USER

async function loadCurrentUser() {
  if ($("profile-loading")) $("profile-loading").hidden = false;
  if ($("profile-content")) $("profile-content").hidden = true;

  try {
    const { ok, data } = await apiFetch(ENDPOINTS.currentUser);

    if (ok && data?.data) {
      populateProfile(data.data);
    } else {
      clearToken();
      showToast("Session expired. Please log in again.", "error");
      setTimeout(() => showScreen("login"), 1000);
    }
  } catch {
    showToast("Could not fetch user data.", "error");
  }
}

async function checkSession() {
  if (!getToken()) {
    showScreen("login");
    return;
  }

  try {
    const { ok, data } = await apiFetch(ENDPOINTS.currentUser);
    if (ok && data?.data) {
      showScreen("dashboard");
      populateProfile(data.data);
    } else {
      clearToken();
      showScreen("login");
    }
  } catch {
    clearToken();
    showScreen("login");
  }
}

// Profile section
function populateProfile(user) {
  if (!user) return;

  const displayName = user.name || user.username || "User";
  const username = user.username || "unknown";
  const email = user.email || "-";
  const role = user.role || "USER";
  const loginType = (user.loginType || "EMAIL_PASSWORD").replace(/_/g, " ");
  const id = user._id || "-";
  const isVerified = !!user.isEmailVerified;
  const createdAt = user.createdAt ? formatDate(user.createdAt) : "-";
  const updatedAt = user.updatedAt ? formatDate(user.updatedAt) : "-";

  const avatarSeed = encodeURIComponent(username);
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=fce7f3,fbcfe8,fde8d0&backgroundType=gradientLinear&clothesColor=f472b6,ec4899,fb923c&hairColor=c084fc,f472b6,be185d`;
  if ($("profile-avatar-img")) $("profile-avatar-img").src = avatarUrl;

  setText("nav-username-badge", `@${username}`);

  setText("profile-name", displayName);
  setText("profile-username", `@${username}`);
  setText("profile-role-badge", role);

  const vBadge = $("verified-badge");
  if (vBadge) vBadge.hidden = !isVerified;

  const emailSpan = document.querySelector("#pmeta-email");
  const joinedSpan = document.querySelector("#pmeta-joined");
  if (emailSpan) emailSpan.textContent = email;
  if (joinedSpan)
    joinedSpan.textContent = `Joined ${formatDateShort(user.createdAt)}`;

  setText("detail-email", email);
  setText("detail-username", `@${username}`);
  setText("detail-role", role);
  setText("detail-login-type", loginType);
  setText("detail-created", createdAt);
  setText("detail-updated", updatedAt);
  setText("detail-id", id);

  $("profile-loading").hidden = true;
  $("profile-content").hidden = false;
}

function clearProfileUI() {
  const fields = [
    "profile-name",
    "profile-username",
    "profile-role-badge",
    "detail-email",
    "detail-username",
    "detail-role",
    "detail-login-type",
    "detail-created",
    "detail-updated",
    "detail-id",
    "nav-username-badge",
  ];
  fields.forEach((id) => {
    setText(id, "-");
  });

  const emailSpan = document.querySelector("#pmeta-email");
  const joinedSpan = document.querySelector("#pmeta-joined");
  if (emailSpan) emailSpan.textContent = "-";
  if (joinedSpan) joinedSpan.textContent = "-";

  if ($("verified-badge")) $("verified-badge").hidden = true;
  if ($("profile-loading")) $("profile-loading").hidden = false;
  if ($("profile-content")) $("profile-content").hidden = true;
  if ($("profile-avatar-img")) $("profile-avatar-img").src = "";
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatDateShort(iso) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function initPasswordToggles() {
  $$(".eye-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = $(btn.dataset.target);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
      btn.style.opacity = input.type === "text" ? "0.5" : "1";
    });
  });
}

function initNavigation() {
  $$("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.goto));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("form-login").addEventListener("submit", handleLogin);
  $("form-register").addEventListener("submit", handleRegister);
  $("btn-logout").addEventListener("click", handleLogout);

  initNavigation();
  initPasswordToggles();
  checkSession();
});
