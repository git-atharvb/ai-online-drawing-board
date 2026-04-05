import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5kt3rK6tlR7ZGFp8hpJh1m7at6cbkfBA",
  authDomain: "online-drawing-board-atharv.firebaseapp.com",
  projectId: "online-drawing-board-atharv",
  storageBucket: "online-drawing-board-atharv.firebasestorage.app",
  messagingSenderId: "709029051833",
  appId: "1:709029051833:web:4f8db58f0c9585595b0a68",
  measurementId: "G-CR3VXNBWQ8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const loginBox = document.getElementById('login-box');
const signupBox = document.getElementById('signup-box');
const goToSignup = document.getElementById('go-to-signup');
const goToLogin = document.getElementById('go-to-login');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const loadingOverlay = document.getElementById('loading-overlay');

const showLoading = () => loadingOverlay.classList.remove('hidden');
const hideLoading = () => loadingOverlay.classList.add('hidden');

// --- Theme Toggle Logic ---
const themeToggle = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
});
// --------------------------

goToSignup.addEventListener('click', () => {
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
    loginError.textContent = '';
    loginForm.reset();
});

goToLogin.addEventListener('click', () => {
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    signupError.textContent = '';
    signupForm.reset();
});

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    showLoading();

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = "index.html")
        .catch((error) => {
            hideLoading();
            signupError.textContent = error.message.replace("Firebase: ", "");
        });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    showLoading();

    signInWithEmailAndPassword(auth, email, password)
        .then(() => window.location.href = "index.html")
        .catch((error) => {
            hideLoading();
            loginError.textContent = error.message.replace("Firebase: ", "");
        });
});

const googleBtns = document.querySelectorAll('.google-btn');
googleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        showLoading();
        signInWithPopup(auth, googleProvider)
            .then(() => window.location.href = "index.html")
            .catch((error) => {
                hideLoading();
                loginError.textContent = error.message.replace("Firebase: ", "");
            });
    });
});

// Clear forms on load to ensure fields are empty after logout or returning
window.addEventListener('DOMContentLoaded', () => {
    loginForm.reset();
    signupForm.reset();
});

// If a user goes directly to login.html while authenticated, push them back inside
onAuthStateChanged(auth, (user) => {
    if (user) window.location.href = "index.html";
});