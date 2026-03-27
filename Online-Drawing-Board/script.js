const canvas = document.getElementById("canvas")
const body = document.querySelector('body');
var theColor = '';
var lineW = 5;
let prevX = null
let prevY = null
let draw = false

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
let imagePlacement = {
    active: false,
    img: null,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
    handleSize: 12, // Larger for easier touch
    activeHandle: null
};
const overlayCanvas = document.getElementById('overlay-canvas');
const overlayCtx = overlayCanvas.getContext('2d');
const placementControls = document.getElementById('placement-controls');
const confirmPlacementBtn = document.getElementById('confirm-placement');
const cancelPlacementBtn = document.getElementById('cancel-placement');
var theInput = document.getElementById("favcolor");

theInput.addEventListener("input", function(){
  theColor = theInput.value;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = theColor;
}, false);

const ctx = canvas.getContext("2d")
ctx.lineWidth = lineW;
ctx.lineCap = "round";
ctx.lineJoin = "round";

function saveState() {
    // If we undo and then draw, remove the "future" redo states
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    history.push(canvas.toDataURL("image/png"));
    historyIndex++;
}

function restoreState(index) {
    let img = new Image();
    img.onload = () => {
        let prevComposite = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "source-over"; // Ensure image renders normally regardless of eraser selection
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        ctx.globalCompositeOperation = prevComposite;
    };
    img.src = history[index];
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

    // Restore the current state after resizing to prevent clearing the drawing
    if (historyIndex !== -1) {
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

themeToggle.addEventListener("click", () => {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        body.classList.add("dark-mode");
        themeToggle.textContent = "☀️"; // Change to sun icon
    } else {
        body.classList.remove("dark-mode");
        themeToggle.textContent = "🌙"; // Change to moon icon
    }
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
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = clr.dataset.clr
    })
})

let eraserBtn = document.querySelector(".eraser")
eraserBtn.addEventListener("click", () => {
    ctx.globalCompositeOperation = "destination-out";
})

let clearBtn = document.querySelector(".clear")
clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
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

    // Draw the current canvas content on top of the background
    tempCtx.drawImage(canvas, 0, 0);

    // Trigger download from the temporary canvas
    let data = tempCanvas.toDataURL("image/png");
    let a = document.createElement("a");
    a.href = data;
    a.download = "sketch.png";
    a.click();
});

let savePdfBtn = document.querySelector(".save-pdf")
savePdfBtn.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;

    // Create a temporary canvas with background for the PDF
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.fillStyle = getBackgroundColor();
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    // Get image data from the temporary canvas
    let imgData = tempCanvas.toDataURL("image/png", 1.0);

    let orientation = canvas.width >= canvas.height ? 'landscape' : 'portrait';
    let pdf = new jsPDF({ orientation: orientation, unit: 'px', format: [canvas.width, canvas.height] });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save("sketch.pdf");
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
        let img = new Image();
        img.onload = function() {
            // Instead of drawing directly, start placement mode
            startImagePlacement(img);
        }
        img.src = event.target.result;
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
    if (textInputActive || imagePlacement.active) return; // Prevent drawing if typing text or placing image
    
    let pos = getPos(e);
    
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
    if (!draw || currentTool === "text" || currentTool === "fill" || imagePlacement.active) return;
    let pos = getPos(e);
    let currentX = pos.x;
    let currentY = pos.y;

    if (currentTool !== "freehand") {
        // Restore the snapshot to "erase" the previous frame of the shape being dragged
        ctx.putImageData(snapshot, 0, 0);
    }

    ctx.beginPath();
    if (currentTool === "freehand") {
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currentX, currentY);
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
};

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
window.addEventListener("mouseup", stopDraw);

canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
canvas.addEventListener("touchmove", (e) => { e.preventDefault(); drawing(e); }, { passive: false });
window.addEventListener("touchend", stopDraw);

window.addEventListener("resize", () => {
    setCanvasDisplaySize(); // Update canvas dimensions
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = lineW;
});

// Initial setup for canvas size and state after the page has fully loaded
window.onload = () => {
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
    // Stamp the image onto the main canvas
    ctx.drawImage(imagePlacement.img, imagePlacement.x, imagePlacement.y, imagePlacement.width, imagePlacement.height);
    saveState();
    endImagePlacement();
});

cancelPlacementBtn.addEventListener('click', () => {
    endImagePlacement();
});

function startImagePlacement(img) {
    imagePlacement.active = true;
    imagePlacement.img = img;

    // Calculate initial size and position to be centered and not too large
    const scale = Math.min((canvas.width * 0.75) / img.width, (canvas.height * 0.75) / img.height);
    imagePlacement.width = img.width * scale;
    imagePlacement.height = img.height * scale;
    imagePlacement.x = (canvas.width - imagePlacement.width) / 2;
    imagePlacement.y = (canvas.height - imagePlacement.height) / 2;

    placementControls.style.display = 'flex';
    overlayCanvas.style.pointerEvents = 'auto';
    overlayCanvas.style.cursor = 'move';

    // Add event listeners for the overlay
    overlayCanvas.addEventListener('mousedown', handlePlacementMouseDown);
    overlayCanvas.addEventListener('mousemove', handlePlacementMouseMove);
    window.addEventListener('mouseup', handlePlacementMouseUp); // Use window to catch mouseup outside canvas

    requestAnimationFrame(animatePlacement);
}

function endImagePlacement() {
    imagePlacement.active = false;
    imagePlacement.img = null;
    imagePlacement.isDragging = false;
    imagePlacement.isResizing = false;

    placementControls.style.display = 'none';
    overlayCanvas.style.pointerEvents = 'none';
    overlayCanvas.style.cursor = 'default';
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    // Remove event listeners to prevent them from firing when not in placement mode
    overlayCanvas.removeEventListener('mousedown', handlePlacementMouseDown);
    overlayCanvas.removeEventListener('mousemove', handlePlacementMouseMove);
    window.removeEventListener('mouseup', handlePlacementMouseUp);
}

function animatePlacement() {
    if (!imagePlacement.active) return;

    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.drawImage(imagePlacement.img, imagePlacement.x, imagePlacement.y, imagePlacement.width, imagePlacement.height);
    drawHandles();

    requestAnimationFrame(animatePlacement);
}

function getHandles() {
    const { x, y, width, height, handleSize } = imagePlacement;
    const halfHandle = handleSize / 2;
    // Using only corner handles for proportional resizing
    return {
        'top-left': { x: x - halfHandle, y: y - halfHandle, width: handleSize, height: handleSize },
        'top-right': { x: x + width - halfHandle, y: y - halfHandle, width: handleSize, height: handleSize },
        'bottom-left': { x: x - halfHandle, y: y + height - halfHandle, width: handleSize, height: handleSize },
        'bottom-right': { x: x + width - halfHandle, y: y + height - halfHandle, width: handleSize, height: handleSize }
    };
}

function drawHandles() {
    const { x, y, width, height } = imagePlacement;
    overlayCtx.strokeStyle = '#007aff';
    overlayCtx.lineWidth = 2;
    overlayCtx.strokeRect(x, y, width, height);

    overlayCtx.fillStyle = '#fff';
    const handles = getHandles();
    for (const handle in handles) {
        overlayCtx.fillRect(handles[handle].x, handles[handle].y, handles[handle].width, handles[handle].height);
        overlayCtx.strokeRect(handles[handle].x, handles[handle].y, handles[handle].width, handles[handle].height);
    }
}

function getHandleAtPos(posX, posY) {
    const handles = getHandles();
    for (const handleName in handles) {
        const handle = handles[handleName];
        if (posX >= handle.x && posX <= handle.x + handle.width &&
            posY >= handle.y && posY <= handle.y + handle.height) {
            return handleName;
        }
    }
    return null;
}

function handlePlacementMouseDown(e) {
    const pos = getPos(e);
    
    const handle = getHandleAtPos(pos.x, pos.y);
    if (handle) {
        imagePlacement.isResizing = true;
        imagePlacement.activeHandle = handle;
    } else if (pos.x >= imagePlacement.x && pos.x <= imagePlacement.x + imagePlacement.width &&
               pos.y >= imagePlacement.y && pos.y <= imagePlacement.y + imagePlacement.height) {
        imagePlacement.isDragging = true;
    }

    imagePlacement.dragStartX = pos.x;
    imagePlacement.dragStartY = pos.y;
}

function handlePlacementMouseMove(e) {
    const pos = getPos(e);
    const dx = pos.x - imagePlacement.dragStartX;
    const dy = pos.y - imagePlacement.dragStartY;

    if (imagePlacement.isDragging) {
        imagePlacement.x += dx;
        imagePlacement.y += dy;
    } else if (imagePlacement.isResizing) {
        const { width, height, activeHandle } = imagePlacement;
        const aspectRatio = width / height;
        let newWidth = width;

        if (activeHandle.includes('right')) {
            newWidth += dx;
        } else if (activeHandle.includes('left')) {
            newWidth -= dx;
        }

        let newHeight = newWidth / aspectRatio;

        if (activeHandle.includes('left')) {
            imagePlacement.x += width - newWidth;
        }
        if (activeHandle.includes('top')) {
            imagePlacement.y += height - newHeight;
        }
        
        imagePlacement.width = newWidth;
        imagePlacement.height = newHeight;

    } else {
        // Update cursor based on hover position
        const handle = getHandleAtPos(pos.x, pos.y);
        if (handle) {
            if (handle.includes('top-left') || handle.includes('bottom-right')) {
                overlayCanvas.style.cursor = 'nwse-resize';
            } else {
                overlayCanvas.style.cursor = 'nesw-resize';
            }
        } else if (pos.x >= imagePlacement.x && pos.x <= imagePlacement.x + imagePlacement.width &&
                   pos.y >= imagePlacement.y && pos.y <= imagePlacement.y + imagePlacement.height) {
            overlayCanvas.style.cursor = 'move';
        } else {
            overlayCanvas.style.cursor = 'default';
        }
    }

    imagePlacement.dragStartX = pos.x;
    imagePlacement.dragStartY = pos.y;
}

function handlePlacementMouseUp(e) {
    imagePlacement.isDragging = false;
    imagePlacement.isResizing = false;
    imagePlacement.activeHandle = null;
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
    // Calculates color distance using Euclidean distance in RGB space.
    // A higher tolerance will fill more "similar" colors, which is needed for anti-aliased edges.
    const distance = Math.sqrt(
        Math.pow(data[pos] - targetColor[0], 2) +
        Math.pow(data[pos + 1] - targetColor[1], 2) +
        Math.pow(data[pos + 2] - targetColor[2], 2)
    );
    return distance <= tolerance;
}

function floodFill(startX, startY, fillColorStr) {
    startX = Math.floor(startX);
    startY = Math.floor(startY);
    const tolerance = 16; // Lower tolerance is more precise. Adjust if it's not filling enough of the anti-aliased edge.
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
        Math.pow(targetColor[2] - fillColor[2], 2)
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
}