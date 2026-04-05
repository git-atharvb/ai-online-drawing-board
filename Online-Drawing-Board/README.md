# Online Drawing App 🎨

### Imagine, Sketch, Revise.

Welcome to the **Online Drawing Board**, an incredibly feature-rich, highly responsive, browser-based drawing application. Built entirely with Vanilla HTML, modern CSS (Glassmorphism), and advanced JavaScript (ES6+), this tool offers a professional-grade digital canvas experience without needing any bulky frontend frameworks.

---

## ✨ Core Features

### 🖌️ Advanced Drawing Engine
*   **Smooth Freehand Drawing:** Implements Bezier curve (`quadraticCurveTo`) mathematical smoothing, ensuring that freehand strokes render fluidly without jagged edges, regardless of mouse speed.
*   **Calligraphy Mode:** Simulates a ribbon fountain pen by duplicating and offsetting the Bezier strokes dynamically.
*   **Dynamic Brush Controls:** Instantly adjust brush thickness, opacity (alpha), and spray-blur (shadowBlur) for realistic airbrush or highlighter effects.
*   **Intelligent Flood Fill:** Includes a custom breadth-first search (BFS) flood-fill algorithm with tolerance calculations to perfectly fill areas while handling anti-aliased edges and gradients gracefully.
*   **Geometric Shapes:** Draw perfect lines, rectangles, circles, isosceles triangles, and mathematically precise stars.

### 📋 Layer Management System
*   **Multi-Layer Support:** Create, delete, hide, and rearrange layers on the fly.
*   **Non-Destructive Editing:** Draw on transparent foreground layers without permanently overwriting the background.
*   **Memory Canvas Compositing:** Background memory canvases merge perfectly down to the primary viewing canvas to maximize performance without dropping frames.

### 🖼️ Image & Text Integration
*   **Fabric.js Image Placement:** Upload local images and manipulate them as objects using the Fabric.js integration. Select, scale, drag, and rotate your image before permanently stamping it onto a layer.
*   **Advanced Text Tool:** Click anywhere on the canvas to open a floating text input. Format text dynamically with multiple fonts, sizes, colors, bold, italic, and underline styling before stamping it.

### ☁️ Cloud & Authentication (Firebase)
*   **Secure Authentication:** User accounts are handled safely via Firebase Authentication.
*   **Cloud Gallery:** Authenticated users can save their canvases directly to Firebase Firestore/Storage.
*   **Gallery Dashboard:** View, retrieve, and delete your saved artworks from a beautiful, responsive grid gallery.

### 💾 Export Capabilities
*   **High-Quality PNG:** Export your art to a raw PNG image instantly.
*   **Web-Worker PDF Generation:** Generates multi-page or scaled PDF documents utilizing `jsPDF`. The heavy PDF rendering math is offloaded completely to a background Web Worker (`pdfWorker.js`), ensuring the main UI never freezes.

### 📱 Modern UI/UX
*   **Glassmorphism Aesthetics:** Beautiful frosted-glass toolbars, menus, and modals that blend with the background ambient orbs.
*   **Dynamic Light/Dark Mode:** Completely togglable CSS-variable-based dark and light themes that remember your preference.
*   **Toast Notifications:** Custom sliding toast notifications provide non-intrusive feedback for actions like saving, loading, errors, and authentication.
*   **Fully Responsive:** Perfect viewport scaling via `dvh` units and CSS Grid. Panels dynamically collapse into mobile-friendly formats on small screens.

---

## 🛠️ Architecture & Technologies

*   **HTML5 Canvas API:** The core rendering engine for all vector and raster graphics.
*   **CSS3 & CSS Variables:** Powers the responsive design, animations, and dual-theme system.
*   **Vanilla JavaScript:** Handles all state management, undo/redo history matrices, layer mathematics, and DOM manipulation.
*   **Web Workers API:** Enables multi-threaded processing for heavy PDF generation.
*   **Firebase SDK v10:** Integrates `firebase-app`, `firebase-auth`, and `firebase-firestore` for backend features.
*   **Fabric.js:** Employed specifically on an overlay-canvas for robust image manipulation before layer stamping.
*   **jsPDF:** Used internally by the Web Worker for document export.

---

## 🛡️ Robust Error Handling & Resilience
This project is built with stability in mind:
*   **Cross-Origin Resource Sharing (CORS) Safeties:** `try...catch` blocks protect the app from crashing if a tainted canvas (e.g., from an external un-proxied image) attempts to export to PNG/PDF.
*   **File Reader Safeties:** Corrupted image uploads are caught via `FileReader.onerror` bindings and safely alert the user via Toast notifications without breaking the app.
*   **Web Worker Fallbacks:** If the PDF generator worker fails to initialize or encounters a memory error, it gracefully passes the error back to the main thread to safely reset the UI state.
*   **Database Protection:** Firestore delete and read queries are wrapped in asynchronous `catch` blocks, ensuring users are notified of network drops without unhandled promise rejections.

---

## 🚀 Installation & Setup

This application operates entirely in the browser, but relies on Firebase for its cloud features.

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/Drawing-App-main.git
   cd Drawing-App-main/Online-Drawing-Board
   ```

2. **Setup Firebase (Optional but recommended)**
   * Go to the Firebase Console.
   * Create a new project and register a Web App.
   * Enable **Authentication** (Email/Password or Google).
   * Enable **Firestore Database**.
   * Replace the `firebaseConfig` object in `gallery.js` and `app-auth.js` with your own credentials.

3. **Run Locally**
   Because of strict browser security policies regarding Web Workers and ES6 Modules, you must run this project through a local server (you cannot simply double click `index.html`).
   * **Using VS Code:** Install the "Live Server" extension and click "Go Live".
   * **Using Python:** Run `python -m http.server 8000` in the directory.
   * **Using Node:** Run `npx serve` in the directory.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check issues page if you want to contribute.

## 📄 License & Credits
**&copy; Programmed & Managed by [Ananya](https://www.linkedin.com/in/ananya-parbat/) & [Atharv](https://www.linkedin.com/in/abowlekar) - 2024-2025**  
This project is open-source and available under the MIT License.
```