import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Protect route: Immediately boot user if they shouldn't be here
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUser = user; // Store user so we can save their drawings under their ID
        // Populate user profile info
        const profileContainer = document.getElementById('user-profile');
        const profilePic = document.getElementById('profile-pic');
        const profileEmail = document.getElementById('profile-email');
        
        if (profileContainer) profileContainer.style.display = 'flex';
        if (profileEmail) profileEmail.textContent = user.email;
        if (profilePic) {
            // Use the Google photo if available, otherwise generate an initial avatar via ui-avatars API
            profilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=random`;
        }
    }
});

// Setup Logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });
}

// Setup Save to Cloud button
const saveCloudBtn = document.getElementById('save-cloud-btn');
if (saveCloudBtn) {
    saveCloudBtn.addEventListener('click', async () => {
        if (!currentUser) return alert("Please log in to save to the cloud.");

        const canvas = document.getElementById('canvas');
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // Replicate background fill logic
        const isDarkMode = document.body.classList.contains('dark-mode');
        tempCtx.fillStyle = isDarkMode ? '#1e1e1e' : '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        const dataUrl = tempCanvas.toDataURL("image/png");

        // Provide UI feedback
        const originalIcon = saveCloudBtn.textContent;
        saveCloudBtn.textContent = '⏳';
        saveCloudBtn.disabled = true;

        try {
            const drawingsRef = collection(db, "drawings");
            await addDoc(drawingsRef, {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                imageData: dataUrl,
                createdAt: new Date().toISOString()
            });
            
            console.log("Saved successfully to Firestore!");
            saveCloudBtn.textContent = '✅';
        } catch (error) {
            console.error("Error saving to cloud:", error);
            saveCloudBtn.textContent = '❌';
        } finally {
            // Reset button after 2 seconds
            setTimeout(() => { saveCloudBtn.textContent = originalIcon; saveCloudBtn.disabled = false; }, 2000);
        }
    });
}

// Setup Gallery Navigation
const galleryBtn = document.getElementById('gallery-btn');
if (galleryBtn) {
    galleryBtn.addEventListener('click', () => {
        window.location.href = "gallery.html";
    });
}