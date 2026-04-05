const canvas = document.getElementById("canvas")
const body = document.querySelector('body');
var theColor = '';
var lineW = 5;
let prevX = null
let prevY = null
let points = []
let draw = false

// Layer & Brush State Variables
let mainCtx = null;
let layers = [];
let activeLayerIndex = 0;
let brushOpacity = 1.0;
let brushBlur = 0;
let isCalligraphy = false;
let isEraser = false;

let currentTool = "freehand";
let snapshot;
let history = [];
let historyIndex = -1;
let textInputActive = false;

let tFamily = "Arial";
let tSize = 24;
let tColor = "#000000";
let tBold = false;
let tItalic = false;
let tUnderline = false;
let currentTextInput = null;

// Image Placement variables
let fabricOverlay = null;
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayCtx = overlayCanvas.getContext('2d');
const placementControls = document.getElementById('placement-controls');
const confirmPlacementBtn = document.getElementById('confirm-placement');
const cancelPlacementBtn = document.getElementById('cancel-placement');
var theInput = document.getElementById("favcolor");

theInput.addEventListener("input", function(){
  theColor = theInput.value;
  isEraser = false;
}, false);

mainCtx = canvas.getContext("2d");
let ctx = mainCtx; // Fallback, will be replaced by layer context

function renderAllLayers() {
    mainCtx.clearRect(0, 0, canvas.width, canvas.height);
    layers.forEach(layer => {
        if (layer.visible) {
            mainCtx.drawImage(layer.canvas, 0, 0);
        }
    });
}

function applyContextStyles(context) {
    context.lineWidth = lineW;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = theColor || "#000000";
    
    if (isEraser) {
        context.globalCompositeOperation = "destination-out";
        context.globalAlpha = 1.0;
        context.shadowBlur = 0;
    } else {
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = brushOpacity;
        context.shadowBlur = brushBlur;
        context.shadowColor = brushBlur > 0 ? context.strokeStyle : "transparent";
    }
}

function saveState() {
    // If we undo and then draw, remove the "future" redo states
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    
    // Save the state of all layers
    const state = layers.map(l => ({
        name: l.name,
        visible: l.visible,
        data: l.canvas.toDataURL("image/png")
    }));
    
    history.push(state);
    historyIndex++;
}

function restoreState(index) {
    const state = history[index];
    if (!state || state.length === 0) return;
    
    layers = [];
    let loadedCount = 0;
    
    state.forEach((lState) => {
        const layer = createLayer(lState.name);
        layer.visible = lState.visible;
        
        let img = new Image();
        img.onload = () => {
            layer.ctx.globalCompositeOperation = "source-over";
            layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            layer.ctx.drawImage(img, 0, 0);
            loadedCount++;
            if (loadedCount === state.length) {
                if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
                ctx = layers[activeLayerIndex].ctx;
                renderAllLayers();
                updateLayerUI();
            }
        };
        img.src = lState.data;
    });
}

// Function to set canvas dimensions based on its computed style
function setCanvasDisplaySize() {
    // Get the computed style of the canvas after CSS has applied max-width/height
    const canvasStyle = getComputedStyle(canvas);
    const displayWidth = parseFloat(canvasStyle.width);
    const displayHeight = parseFloat(canvasStyle.height);

    // Set the canvas drawing buffer size to match its display size
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Also resize the overlay canvas
    overlayCanvas.width = displayWidth;
    overlayCanvas.height = displayHeight;

    // Resize all layers while retaining their content
    layers.forEach(layer => {
        const temp = layer.canvas.toDataURL();
        layer.canvas.width = displayWidth;
        layer.canvas.height = displayHeight;
        let img = new Image();
        img.onload = () => {
            layer.ctx.drawImage(img, 0, 0);
            renderAllLayers();
        }
        img.src = temp;
    });

    // Restore the current state after resizing to prevent clearing the drawing
    if (historyIndex !== -1 && layers.length === 0) {
        restoreState(historyIndex);
    }
}

document.getElementById("ageInputId").oninput = function() {
    lineW = document.getElementById("ageInputId").value;
    document.getElementById("ageOutputId").innerHTML = lineW;
    ctx.lineWidth = lineW;
};  

let textNav = document.getElementById("text-nav");
let textBtn = document.querySelector(".text-tool-btn");
textBtn.addEventListener("click", () => {
    currentTool = "text";
    textNav.style.display = "flex";
});

let toolSelect = document.getElementById("tool-select");
toolSelect.addEventListener("change", (e) => {
    currentTool = e.target.value;
    if (currentTool !== "text") {
        textNav.style.display = "none";
    }
});

let themeToggle = document.querySelector(".theme-toggle");
let isDarkMode = false;

// Load theme on startup
if (localStorage.getItem('theme') === 'dark') {
    body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
    isDarkMode = true;
}

themeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        body.classList.add("dark-mode");
        themeToggle.textContent = "☀️"; // Change to sun icon
    } else {
        body.classList.remove("dark-mode");
        themeToggle.textContent = "🌙"; // Change to moon icon
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
});

// Helper function to get the current background color for saving
function getBackgroundColor() {
    // Uses the canvas background color from CSS
    return isDarkMode ? '#1e1e1e' : '#ffffff';
}

const updateTextInputStyle = () => {
    if (!currentTextInput) return;
    currentTextInput.style.fontFamily = tFamily;
    currentTextInput.style.fontSize = tSize + "px";
    currentTextInput.style.color = tColor;
    currentTextInput.style.fontWeight = tBold ? "bold" : "normal";
    currentTextInput.style.fontStyle = tItalic ? "italic" : "normal";
    currentTextInput.style.textDecoration = tUnderline ? "underline" : "none";
};

document.getElementById("font-family").addEventListener("change", (e) => {
    tFamily = e.target.value; updateTextInputStyle();
});
document.getElementById("text-size").addEventListener("input", (e) => {
    tSize = e.target.value; updateTextInputStyle();
});
document.getElementById("text-color").addEventListener("input", (e) => {
    tColor = e.target.value; updateTextInputStyle();
});

let boldBtn = document.getElementById("bold-btn");
boldBtn.addEventListener("click", () => {
    tBold = !tBold;
    boldBtn.classList.toggle("active", tBold);
    updateTextInputStyle();
});

let italicBtn = document.getElementById("italic-btn");
italicBtn.addEventListener("click", () => {
    tItalic = !tItalic;
    italicBtn.classList.toggle("active", tItalic);
    updateTextInputStyle();
});

let underlineBtn = document.getElementById("underline-btn");
underlineBtn.addEventListener("click", () => {
    tUnderline = !tUnderline;
    underlineBtn.classList.toggle("active", tUnderline);
    updateTextInputStyle();
});

document.getElementById("close-text-btn").addEventListener("click", () => {
    textNav.style.display = "none";
    currentTool = toolSelect.value; // Revert tool
});

let clrs = document.querySelectorAll(".clr")
clrs = Array.from(clrs)
clrs.forEach(clr => {
    clr.addEventListener("click", () => {
        isEraser = false;
        theColor = clr.dataset.clr;
    })
})

let eraserBtn = document.querySelector(".eraser")
eraserBtn.addEventListener("click", () => {
    isEraser = true;
})

let clearBtn = document.querySelector(".clear")
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    renderAllLayers();
    saveState();
})

let saveBtn = document.querySelector(".save")
saveBtn.addEventListener("click", () => {
    // Create a temporary canvas to add a background
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill the background based on the current theme
    tempCtx.fillStyle = getBackgroundColor();
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    try {
        // Draw the current canvas content on top of the background
        tempCtx.drawImage(canvas, 0, 0);
    
        // Trigger download from the temporary canvas
        let data = tempCanvas.toDataURL("image/png");
        let a = document.createElement("a");
        a.href = data;
        a.download = "sketch.png";
        a.click();
        showToast("Image saved successfully!", "success");
    } catch (e) {
        console.error("Error saving image:", e);
        showToast("Failed to save image. The canvas might contain cross-origin data.", "error");
    }
});

let savePdfBtn = document.querySelector(".save-pdf")
savePdfBtn.addEventListener("click", () => {
    const originalText = savePdfBtn.textContent;
    savePdfBtn.textContent = '⏳';
    savePdfBtn.disabled = true;

    // Create a temporary canvas with background for the PDF
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.fillStyle = getBackgroundColor();
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    try {
        // Get image data from the temporary canvas
        let imgData = tempCanvas.toDataURL("image/png", 1.0);
    
        const worker = new Worker('pdfWorker.js');
        
        worker.postMessage({
            imgData: imgData,
            width: canvas.width,
            height: canvas.height
        });
        
        worker.onmessage = function(e) {
            if (e.data.error) {
                console.error('PDF Worker Error:', e.data.error);
                showToast("Failed to generate PDF: " + e.data.error, "error");
            } else {
                const { pdfBlob } = e.data;
                const blobUrl = URL.createObjectURL(pdfBlob);
                
                let a = document.createElement("a");
                a.href = blobUrl;
                a.download = "sketch.pdf";
                a.click();
                
                URL.revokeObjectURL(blobUrl);
                showToast("PDF saved successfully!", "success");
            }
            worker.terminate();
            savePdfBtn.textContent = originalText;
            savePdfBtn.disabled = false;
        };
        
        worker.onerror = function(err) {
            console.error('PDF Worker Error:', err);
            showToast("Failed to initialize PDF Generator.", "error");
            worker.terminate();
            savePdfBtn.textContent = originalText;
            savePdfBtn.disabled = false;
        };
    } catch (e) {
        console.error("Error preparing PDF data:", e);
        showToast("Failed to process canvas. Cross-origin data might be present.", "error");
        savePdfBtn.textContent = originalText;
        savePdfBtn.disabled = false;
    }
});

let undoBtn = document.querySelector(".undo")
undoBtn.addEventListener("click", () => {
    if (historyIndex > 0) {
        historyIndex--;
        restoreState(historyIndex);
    }
})

let redoBtn = document.querySelector(".redo")
redoBtn.addEventListener("click", () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        restoreState(historyIndex);
    }
})

let uploadBtn = document.querySelector(".upload-btn")
let uploadInput = document.getElementById("upload")
uploadBtn.addEventListener("click", () => uploadInput.click())

uploadInput.addEventListener("change", (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(event) {
        startImagePlacement(event.target.result);
    }
    reader.onerror = function() {
        console.error("Error reading uploaded file.");
        showToast("Failed to read the uploaded image.", "error");
    }
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input so same file can be re-uploaded
})

function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

const startDraw = (e) => {
    if (textInputActive || fabricOverlay) return; // Prevent drawing if typing text or placing image
    
    let pos = getPos(e);
    
    applyContextStyles(ctx); // Ensure active context has correct colors and brush settings
    
    if (currentTool === "text") {
        addTextInput(pos.x, pos.y);
        return;
    } else if (currentTool === "fill") {
        floodFill(pos.x, pos.y, ctx.strokeStyle);
        saveState();
        return;
    }

    draw = true;
    prevX = pos.x;
    prevY = pos.y;
    points = [pos];
    
    // Save snapshot of canvas before drawing the shape
    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    if (currentTool === "freehand") {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(prevX, prevY);
        ctx.stroke();
    }
};

const stopDraw = () => {
    if (draw) {
        saveState();
        draw = false;
    }
};

const drawing = (e) => {
    if (!draw || currentTool === "text" || currentTool === "fill" || fabricOverlay) return;
    let pos = getPos(e);
    let currentX = pos.x;
    let currentY = pos.y;

    // Restore the snapshot to "erase" the previous frame of the shape being dragged,
    // and also to redraw the dynamically smoothed bezier path for freehand
    ctx.putImageData(snapshot, 0, 0);

    ctx.beginPath();
    if (currentTool === "freehand") {
        points.push(pos);
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length - 1; i++) {
            let midX = (points[i].x + points[i + 1].x) / 2;
            let midY = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        if (points.length > 1) {
            let lastPoint = points[points.length - 1];
            ctx.lineTo(lastPoint.x, lastPoint.y);
        }
        
        // Add Calligraphy offset stroke
        if (isCalligraphy) {
            ctx.moveTo(points[0].x + lineW/2, points[0].y + lineW/2);
            for (let i = 1; i < points.length - 1; i++) {
                let midX = (points[i].x + points[i + 1].x) / 2;
                let midY = (points[i].y + points[i + 1].y) / 2;
                ctx.quadraticCurveTo(points[i].x + lineW/2, points[i].y + lineW/2, midX + lineW/2, midY + lineW/2);
            }
            if (points.length > 1) {
                let lastPoint = points[points.length - 1];
                ctx.lineTo(lastPoint.x + lineW/2, lastPoint.y + lineW/2);
            }
        }
        
        ctx.stroke();
        prevX = currentX;
        prevY = currentY;
    } else if (currentTool === "line") {
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } else if (currentTool === "rectangle") {
        ctx.strokeRect(prevX, prevY, currentX - prevX, currentY - prevY);
    } else if (currentTool === "circle") {
        let radius = Math.sqrt(Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2));
        ctx.arc(prevX, prevY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    } else if (currentTool === "triangle") {
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
        ctx.lineTo(prevX * 2 - currentX, currentY); // Isosceles logic
        ctx.closePath();
        ctx.stroke();
    } else if (currentTool === "star") {
        let radius = Math.sqrt(Math.pow(currentX - prevX, 2) + Math.pow(currentY - prevY, 2));
        drawStar(ctx, prevX, prevY, 5, radius, radius / 2);
        ctx.stroke();
    }
    
    renderAllLayers(); // Composite updates sequentially
};

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
window.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); drawing(e); }, { passive: false });
window.addEventListener("touchend", stopDraw);

let resizeTimeout;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        setCanvasDisplaySize(); // Update canvas dimensions
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = lineW;
    }, 150); // 150ms debounce for smoother resizing
});

// --- Layer & Brush UI Injection ---
function createLayer(name) {
    const lCanvas = document.createElement('canvas');
    lCanvas.width = canvas.width || 800; 
    lCanvas.height = canvas.height || 600;
    const layer = { id: Date.now(), name: name, canvas: lCanvas, ctx: lCanvas.getContext('2d'), visible: true };
    layers.push(layer);
    return layer;
}

function initAdvancedUI() {
    const advancedPanel = document.createElement('div');
    advancedPanel.className = 'advanced-panel collapsed-mobile';
    advancedPanel.innerHTML = `
        <div class="advanced-panel-toggle" title="Toggle Layers & Brushes">⚙️ Layers & Brushes</div>
        <div class="advanced-panel-content">
            <div class="brush-controls">
                <h4>Brush Options</h4>
                <label>Opacity: <input type="range" id="brush-opacity" min="0.1" max="1" step="0.1" value="1"></label>
                <label>Spray Blur: <input type="range" id="brush-blur" min="0" max="20" step="1" value="0"></label>
                <label><input type="checkbox" id="brush-calligraphy"> Calligraphy Pen</label>
            </div>
            <div class="layer-controls" style="margin-top: 15px;">
                <h4 style="display:flex; justify-content:space-between; align-items:center; margin:0 0 10px 0;">Layers <button id="add-layer-btn" style="cursor:pointer; padding:2px 8px; border-radius:4px; border:none; background:#007aff; color:white;">+</button></h4>
                <ul id="layer-list" style="list-style:none; padding:0; margin:0; max-height:150px; overflow-y:auto;"></ul>
            </div>
        </div>
    `;
    document.body.appendChild(advancedPanel);

    document.getElementById('brush-opacity').addEventListener('input', (e) => brushOpacity = parseFloat(e.target.value));
    document.getElementById('brush-blur').addEventListener('input', (e) => brushBlur = parseInt(e.target.value));
    document.getElementById('brush-calligraphy').addEventListener('change', (e) => isCalligraphy = e.target.checked);
    
    document.querySelector('.advanced-panel-toggle').addEventListener('click', () => {
        advancedPanel.classList.toggle('collapsed-mobile');
    });
    
    document.getElementById('add-layer-btn').addEventListener('click', () => {
        createLayer('Layer ' + (layers.length + 1));
        activeLayerIndex = layers.length - 1;
        ctx = layers[activeLayerIndex].ctx;
        updateLayerUI();
    });
}

function updateLayerUI() {
    const list = document.getElementById('layer-list');
    if (!list) return;
    list.innerHTML = '';
    [...layers].reverse().forEach((layer, reversedIndex) => {
        const realIndex = layers.length - 1 - reversedIndex;
        const li = document.createElement('li');
        li.className = 'layer-item' + (realIndex === activeLayerIndex ? ' active' : '');
        li.innerHTML = `
            <span class="layer-name">${layer.name}</span>
            <div class="layer-actions">
                <button class="toggle-vis" data-idx="${realIndex}" title="Toggle Visibility">${layer.visible ? '👁️' : '🔒'}</button>
                <button class="delete-layer" data-idx="${realIndex}" title="Delete Layer">🗑️</button>
            </div>
        `;
        li.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                activeLayerIndex = realIndex;
                ctx = layers[activeLayerIndex].ctx;
                updateLayerUI();
            }
        };
        list.appendChild(li);
    });

    document.querySelectorAll('.toggle-vis').forEach(btn => {
        btn.onclick = (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            layers[idx].visible = !layers[idx].visible;
            renderAllLayers();
            updateLayerUI();
        };
    });
    document.querySelectorAll('.delete-layer').forEach(btn => {
        btn.onclick = (e) => {
            if (layers.length === 1) return alert("Cannot delete the last layer.");
            const idx = parseInt(e.target.getAttribute('data-idx'));
            layers.splice(idx, 1);
            if (activeLayerIndex >= layers.length) activeLayerIndex = layers.length - 1;
            ctx = layers[activeLayerIndex].ctx;
            renderAllLayers();
            updateLayerUI();
        };
    });
}

// Initial setup for canvas size and state after the page has fully loaded
window.onload = () => {
    initAdvancedUI(); // Setup custom layers and controls Panel
    createLayer('Background'); // Create the first core drawing layer
    ctx = layers[0].ctx;
    updateLayerUI();
    
    setCanvasDisplaySize();
    saveState(); // Save the blank canvas state at launch

    // --- Custom Tooltip Initialization ---
    // Replaces native browser tooltips with a custom, stylable one.
    document.querySelectorAll('[title]').forEach(el => {
        if (el.getAttribute('title')) {
            el.setAttribute('data-tooltip', el.getAttribute('title'));
            el.removeAttribute('title');
        }
    });
};

confirmPlacementBtn.addEventListener('click', () => {
    if (fabricOverlay) {
        // Deselect to hide the bounding box and rotation controls before stamping
        fabricOverlay.discardActiveObject();
        fabricOverlay.renderAll();
        
        // Stamp the Fabric canvas directly onto our active layer context
        ctx.drawImage(fabricOverlay.getElement(), 0, 0);
        renderAllLayers();
        saveState();
        endImagePlacement();
    }
});

cancelPlacementBtn.addEventListener('click', () => {
    endImagePlacement();
});

function startImagePlacement(imgSrc) {
    placementControls.style.display = 'flex';
    
    // 1. Initialize Fabric onto the overlay canvas
    fabricOverlay = new fabric.Canvas('overlay-canvas', {
        width: canvas.width,
        height: canvas.height
    });
    
    // Ensure the wrapper container catches mouse events
    const container = document.querySelector('.canvas-container');
    if (container) {
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
        container.style.pointerEvents = 'auto';
    }

    // 2. Load the image into Fabric
    fabric.Image.fromURL(imgSrc, function(img) {
        if (!img) {
            showToast("Failed to load image into canvas.", "error");
            endImagePlacement();
            return;
        }
        const scale = Math.min((canvas.width * 0.75) / img.width, (canvas.height * 0.75) / img.height);
        
        img.set({
            scaleX: scale,
            scaleY: scale,
            left: canvas.width / 2,
            top: canvas.height / 2,
            originX: 'center',
            originY: 'center',
            borderColor: '#007aff',
            cornerColor: '#fff',
            cornerStrokeColor: '#007aff',
            transparentCorners: false,
            cornerSize: 12
        });
        
        fabricOverlay.add(img);
        fabricOverlay.setActiveObject(img);
    });
}

function endImagePlacement() {
    placementControls.style.display = 'none';
    
    if (fabricOverlay) {
        // Calling dispose() destroys the Fabric wrapper and restores the raw canvas element!
        fabricOverlay.dispose();
        fabricOverlay = null;
    }
    
    overlayCanvas.style.pointerEvents = 'none';
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
}

function addTextInput(x, y) {
    textInputActive = true;
    let input = document.createElement("input");
    input.type = "text";
    input.className = "text-input-overlay";
    
    const rect = canvas.getBoundingClientRect();
    input.style.left = (x + rect.left) + "px";
    input.style.top = (y + rect.top) + "px";
    
    currentTextInput = input;
    updateTextInputStyle(); // Apply initial styles
    
    document.body.appendChild(input);
    setTimeout(() => input.focus(), 0); // Focus after rendering
    
    let finalizeText = () => {
        if (!textInputActive) return;
        textInputActive = false;
        let text = input.value;
        if (text.trim() !== "") {
            ctx.font = `${tItalic ? "italic " : ""}${tBold ? "bold " : ""}${tSize}px "${tFamily}"`;
            ctx.textBaseline = "top";
            
            let prevFillStyle = ctx.fillStyle;
            ctx.fillStyle = tColor; 
            ctx.fillText(text, x, y);
            
            // Canvas Underline Logic
            if (tUnderline) {
                let metrics = ctx.measureText(text);
                let textWidth = metrics.width;
                ctx.beginPath();
                let prevStrokeStyle = ctx.strokeStyle;
                let prevLineWidth = ctx.lineWidth;
                ctx.strokeStyle = tColor;
                ctx.lineWidth = Math.max(1, tSize / 15);
                let underlineY = y + parseFloat(tSize) * 1.1; // Draw right below the text
                ctx.moveTo(x, underlineY);
                ctx.lineTo(x + textWidth, underlineY);
                ctx.stroke();
                ctx.strokeStyle = prevStrokeStyle;
                ctx.lineWidth = prevLineWidth;
            }
            
            ctx.fillStyle = prevFillStyle;
            renderAllLayers();
            
            saveState();
        }
        if (input.parentNode) document.body.removeChild(input);
        currentTextInput = null;
    };
    
    input.addEventListener("blur", finalizeText);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") finalizeText();
    });
}

// --- Flood Fill Algorithm Logic ---
function colorToRGBA(colorStr) {
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = 1; tempCanvas.height = 1;
    let tempCtx = tempCanvas.getContext("2d");
    tempCtx.fillStyle = colorStr;
    tempCtx.fillRect(0, 0, 1, 1);
    return tempCtx.getImageData(0, 0, 1, 1).data;
}

function isColorSimilar(data, pos, targetColor, tolerance) {
    // First, check for a significant difference in alpha. This is the most reliable way to find a "hard" edge
    // and prevents the fill from leaking from transparent areas into opaque lines of the same RGB color (e.g., black).
    if (Math.abs(data[pos + 3] - targetColor[3]) > tolerance) {
        return false;
    }

    // If alpha is similar, check the RGB distance.
    const distance = Math.sqrt(
        Math.pow(data[pos] - targetColor[0], 2) +
        Math.pow(data[pos + 1] - targetColor[1], 2) +
        Math.pow(data[pos + 2] - targetColor[2], 2)
    );

    // We use a higher tolerance for RGB to account for anti-aliasing gradients.
    // A pixel is similar if its RGB values are reasonably close to the target, provided the alpha was also close.
    return distance <= (tolerance * 3);
}

function floodFill(startX, startY, fillColorStr) {
    startX = Math.floor(startX);
    startY = Math.floor(startY);
    const tolerance = 32; // Increased tolerance for better anti-aliasing fill
    let w = canvas.width;
    let h = canvas.height;
    let imgData = ctx.getImageData(0, 0, w, h);
    let data = imgData.data;

    let startPos = (startY * w + startX) * 4;
    let targetColor = [data[startPos], data[startPos + 1], data[startPos + 2], data[startPos + 3]];
    let fillColor = colorToRGBA(fillColorStr);

    // If the color to fill is already very similar to the target color, do nothing.
    const initialDistance = Math.sqrt(
        Math.pow(targetColor[0] - fillColor[0], 2) +
        Math.pow(targetColor[1] - fillColor[1], 2) +
        Math.pow(targetColor[2] - fillColor[2], 2) +
        Math.pow(targetColor[3] - fillColor[3], 2) // Include alpha in this check
    );
    if (initialDistance <= tolerance) return;

    let stack = [[startX, startY]];
    
    while (stack.length > 0) {
        let [x, y] = stack.pop();
        let pos = (y * w + x) * 4;
        
        while (y >= 0 && isColorSimilar(data, pos, targetColor, tolerance)) {
            y--;
            pos -= w * 4;
        }
        pos += w * 4;
        y++;
        
        let reachLeft = false;
        let reachRight = false;
        
        while (y < h && isColorSimilar(data, pos, targetColor, tolerance)) {
            data[pos] = fillColor[0];
            data[pos + 1] = fillColor[1];
            data[pos + 2] = fillColor[2];
            data[pos + 3] = 255; // Ensure filled area is fully opaque
            
            if (x > 0) {
                if (isColorSimilar(data, pos - 4, targetColor, tolerance)) {
                    if (!reachLeft) { stack.push([x - 1, y]); reachLeft = true; }
                } else if (reachLeft) { reachLeft = false; }
            }
            
            if (x < w - 1) {
                if (isColorSimilar(data, pos + 4, targetColor, tolerance)) {
                    if (!reachRight) { stack.push([x + 1, y]); reachRight = true; }
                } else if (reachRight) { reachRight = false; }
            }
            y++;
            pos += w * 4;
        }
    }
    ctx.putImageData(imgData, 0, 0);
    renderAllLayers();
}

// --- Toast Notification & Auth Messages ---
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let icon = '✨';
    if (type === 'success') icon = '🎉';
    if (type === 'info') icon = '👋';
    if (type === 'error') icon = '⚠️';
    
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

window.addEventListener('DOMContentLoaded', () => {
    const profileEmail = document.getElementById('profile-email');
    let welcomeShown = sessionStorage.getItem('welcomeShown') === 'true';
    
    // 1. Welcome Message: Detect when the profile email is loaded by Firebase
    if (profileEmail && !welcomeShown) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const emailText = mutation.target.textContent;
                if (emailText && !welcomeShown) {
                    // Extract formatted name from email (e.g., "john.doe@gmail.com" -> "John Doe")
                    const namePart = emailText.split('@')[0].replace(/[._]/g, ' ');
                    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
                    
                    showToast(`Welcome back, ${formattedName}!`, 'success');
                    sessionStorage.setItem('welcomeShown', 'true');
                    welcomeShown = true;
                    observer.disconnect();
                }
            });
        });
        observer.observe(profileEmail, { childList: true, characterData: true, subtree: true });
    }

    // 2. Thank You Message: Intercept the Logout button click to show message before redirect
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        let isLoggingOut = false;
        logoutBtn.addEventListener('click', (e) => {
            if (!isLoggingOut) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Prevent app-auth.js from firing immediately
                isLoggingOut = true;
                
                showToast('Thank you for creating with us! Logging out...', 'info');
                
                // Wait 1.5 seconds to let user read the toast, then trigger actual logout
                setTimeout(() => {
                    logoutBtn.click(); // Now isLoggingOut is true, so this propagates to app-auth.js
                }, 1500);
            }
        }, true); // Use capture phase to ensure this runs BEFORE other click listeners
    }
});