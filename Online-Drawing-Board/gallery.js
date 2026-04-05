import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

const galleryContainer = document.getElementById('gallery-container');
const loadingOverlay = document.getElementById('loading-overlay');

// Modal elements
const modal = document.getElementById('image-modal');
const modalImg = document.getElementById('modal-img');
const modalClose = document.getElementById('modal-close');

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

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("index.html");
        return;
    }
    
    try {
        const q = query(
            collection(db, "drawings"), 
            where("userId", "==", user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        loadingOverlay.classList.add('hidden');

        if (querySnapshot.empty) {
            galleryContainer.innerHTML = `<div class="empty-gallery">No drawings saved yet. Go make some art! 🎨</div>`;
            return;
        }

        // Fetch and sort locally by date to avoid requiring a composite index setup in Firestore console
        const drawings = [];
        querySnapshot.forEach((doc) => drawings.push({ id: doc.id, ...doc.data() }));
        drawings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        drawings.forEach((drawing) => {
            const card = document.createElement('div');
            card.className = 'gallery-item';
            
            const date = new Date(drawing.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            card.innerHTML = `
                <img src="${drawing.imageData}" alt="Saved Drawing" class="gallery-img-preview" title="Click to view full screen">
                <div class="gallery-item-content">
                    <div class="date-text">Saved: ${date}</div>
                    <div class="gallery-action-btns">
                        <button class="download-drawing-btn" data-url="${drawing.imageData}">⬇️ Download</button>
                        <button class="delete-drawing-btn" data-id="${drawing.id}">🗑️ Delete</button>
                    </div>
                </div>
            `;
            galleryContainer.appendChild(card);
        });

        // Attach event listeners to images for full-screen preview
        document.querySelectorAll('.gallery-img-preview').forEach(img => {
            img.addEventListener('click', (e) => {
                modalImg.src = e.target.src;
                modal.classList.add('show');
            });
        });

        // Attach event listeners to download buttons
        document.querySelectorAll('.download-drawing-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.target.getAttribute('data-url');
                const a = document.createElement('a');
                a.href = url;
                a.download = `cloud_sketch_${Date.now()}.png`;
                a.click();
            });
        });

        // Attach event listeners to delete buttons
        document.querySelectorAll('.delete-drawing-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                try {
                    const docId = e.target.getAttribute('data-id');
                    if (confirm("Are you sure you want to permanently delete this drawing?")) {
                        e.target.textContent = 'Deleting...';
                        e.target.disabled = true;
                        await deleteDoc(doc(db, "drawings", docId));
                        e.target.closest('.gallery-item').remove();
                    }
                } catch (error) {
                    console.error("Error deleting document:", error);
                    alert("Failed to delete drawing. Please try again.");
                    e.target.textContent = '🗑️ Delete';
                    e.target.disabled = false;
                }
            });
        });
    } catch (error) {
        loadingOverlay.classList.add('hidden');
        galleryContainer.innerHTML = `<div class="empty-gallery">Error loading drawings. Please check your connection.</div>`;
    }
});

// Close modal when clicking the 'X' button
modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
});

// Close modal when clicking anywhere outside the image
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});