import "./App.css";
import { useRef, useState, useEffect, act } from "react";

const borderWidth = 5 // FIX THIS SOMETIME

import selectIcon from './assets/select-icon.svg'
import drawIcon from "./assets/draw-icon.svg"
import arrowIcon from "./assets/arrow-icon.svg"
import eraserIcon from "./assets/eraser-icon.svg"
import textIcon from "./assets/text-icon.svg"
import noteIcon from "./assets/note-icon.svg"
import rectangleIcon from "./assets/rectangle-icon.svg"
import circleIcon from "./assets/circle-icon.svg"
import triangleIcon from "./assets/triangle-icon.svg"
import diamondIcon from "./assets/diamond-icon.svg"
import hexagonIcon from "./assets/hexagon-icon.svg"
import ovalIcon from "./assets/oval-icon.svg"
import trapezoidIcon from "./assets/rhombus-icon.svg"
import starIcon from "./assets/star-icon.svg"
import cloudIcon from "./assets/cloud-icon.svg"
import heartIcon from "./assets/heart-icon.svg"
import lineIcon from "./assets/line-icon.svg"
import highlighterIcon from "./assets/highlighter-icon.svg"
import laserIcon from "./assets/laser-icon.svg"
import handIcon from "./assets/hand-icon.svg"
import frameIcon from "./assets/frame-icon.svg"
import assetIcon from "./assets/asset-icon.svg"
import { path } from "framer-motion/client";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const translationRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const [tool, setTool] = useState("select");
  const [activeTool, setActiveTool] = useState(null);

  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const selectedBoxRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [eraserBox, setEraserBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [selectedElements, setSelectedElements] = useState([]);
  const [hoveredElements, setHoveredElements] = useState([]);
  const [startTextBox, setStartTextBox] = useState(null);
  const [activeInput, setActiveInput] = useState(null);

  const pathsRef = useRef([]);
  const textBoxesRef = useRef([]);
  const imagesRef = useRef([]);
  const notesRef = useRef([]);

  const [currentShapeId, setCurrentShapeId] = useState(null);

  const resizeHandlesRef = useRef([]);
  const [resizeDirection, setResizeDirection] = useState(null);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        ctxRef.current = canvas.getContext("2d");
        ctxRef.current.font = "16px Arial";
        redrawCanvas(); // Redraw to reflect the current state after resizing
      }
    };
  
    // Initial setup
    resizeCanvas();
  
    // Resize listener
    window.addEventListener("resize", resizeCanvas);
  
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const drawTextWithLetterSpacing = (ctx, text, x, y, letterSpacing, lineHeight = 20, scale = 1) => {
    if (!ctx) {
      console.error("Canvas context is not initialized.");
      return;
    }
  
    const lines = text.split("\n"); // Handle multi-line text
    lines.forEach((line, index) => {
      let currentX = x;
      const currentY = y + index * lineHeight * scale; // Adjust Y position for each line
  
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        ctx.fillText(char, currentX, currentY);
        const charWidth = ctx.measureText(char).width;
        currentX += charWidth + (char === " " ? 0 : letterSpacing * scale); // Scale letterSpacing
      }
    });
  }


  const handleExport = () => {
    const data = JSON.stringify({
      paths: pathsRef.current,
      textBoxes: textBoxesRef.current,
      notes: notesRef.current,
      undoStack: undoStack.current,
      redoStack: redoStack.current,
    });
  
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement('a');
    a.href = url;
    a.download = 'canvas-state.json';
    a.click();
  
    URL.revokeObjectURL(url);
  };
  
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
  
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);
  
          // Load into refs
          pathsRef.current = state.paths || [];
          textBoxesRef.current = state.textBoxes || [];
          notesRef.current = state.notes || [];
  
          // Load undo/redo stacks
          undoStack.current = state.undoStack || [];
          redoStack.current = state.redoStack || [];
  
          redrawCanvas(); // Redraw after loading
        } catch (error) {
          console.error('Failed to load file:', error);
          alert('Invalid file format');
        }
      };
  
      reader.readAsText(file);
    };
  
    input.click(); // Trigger file input
  };

  const saveSnapshot = () => {

    undoStack.current.push({
      paths: [...pathsRef.current],
      textBoxes: [...textBoxesRef.current],
      notes: [...notesRef.current],
    });

    redoStack.current = []; // Clear redo stack on new action
  };

  const handleUndo = () => {
  
    if (undoStack.current.length > 1) {
      // 1. Pop the last state (which is identical to the current one)
      undoStack.current.pop()
  
      // 2. The next state becomes the new "current state"
      const lastState = undoStack.current[undoStack.current.length - 1];
  
      // 3. Push the current state to the redo stack
      redoStack.current.push({
        paths: [...pathsRef.current],
        textBoxes: [...textBoxesRef.current],
        notes: [...notesRef.current],
      })
  
      // 4. Restore the canvas to the previous state (deep copy, because lastState is just a reference to memory)      
      pathsRef.current = structuredClone(lastState.paths);
      textBoxesRef.current = structuredClone(lastState.textBoxes);
      notesRef.current = structuredClone(lastState.notes);
  
      redrawCanvas();

    }

    console.log("Undo", undoStack.current);
    console.log("Redo", redoStack.current);

  };
  
  const handleRedo = () => {
  
    if (redoStack.current.length > 0) {
      // 1. Pop from the redo stack
      const nextState = redoStack.current.pop();
  
      // 2. Restore the canvas state
      pathsRef.current = nextState.paths;
      textBoxesRef.current = nextState.textBoxes;
      notesRef.current = nextState.notes;
  
      redrawCanvas();
  
      // 3. Push the new state to undoStack (like a new snapshot)
      undoStack.current.push({
        paths: [...pathsRef.current],
        textBoxes: [...textBoxesRef.current],
        notes: [...notesRef.current],
      });
    }

    console.log("Undo", undoStack.current);
    console.log("Redo", redoStack.current);

  };
  
  useEffect(() => {
    const handleUndoRedo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Ctrl+Z or Cmd+Z for Undo
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
        e.preventDefault();
        handleRedo();
      }
    };
  
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, []);
  
  const undoStack = useRef([{ paths: [], textBoxes: [], notes: [] }]);
  const redoStack = useRef([]);
  

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const findOverlappingPaths = (selectionBox) => {
    const selectedPaths = [];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    // Convert selectionBox to canvas coordinates
    const left = (selectionBox.left - rect.left - translationRef.current.x) / scaleRef.current;
    const top = (selectionBox.top - rect.top - translationRef.current.y) / scaleRef.current;
    const right = left + selectionBox.width / scaleRef.current;
    const bottom = top + selectionBox.height / scaleRef.current;
  
    // ✅ Check paths (lines, arrows, shapes, etc.)
    pathsRef.current.forEach((path) => {
      if (path.type === 'arrow' || path.type === 'line') {
        const pathLeft = Math.min(path.startX, path.endX);
        const pathRight = Math.max(path.startX, path.endX);
        const pathTop = Math.min(path.startY, path.endY);
        const pathBottom = Math.max(path.startY, path.endY);
  
        if (
          pathLeft < right &&
          pathRight > left &&
          pathTop < bottom &&
          pathBottom > top
        ) {
          selectedPaths.push(path);
        }
      } else if (
        [
          'rectangle', 'circle', 'triangle', 'diamond', 'hexagon',
          'oval', 'trapezoid', 'star', 'cloud', 'heart', 'x-box', 'check-box'
        ].includes(path.type)
      ) {
        // ✅ For shapes, use the bounding box
        const pathLeft = path.x;
        const pathRight = path.x + Math.abs(path.width);
        const pathTop = path.y;
        const pathBottom = path.y + Math.abs(path.height);
  
        if (
          pathLeft < right &&
          pathRight > left &&
          pathTop < bottom &&
          pathBottom > top
        ) {
          selectedPaths.push(path);
        }
      } else if (path.type === 'draw') {
        const isOverlapping = path.points.some(({ x, y }) => {

          return (
            x >= left &&
            x <= right &&
            y >= top &&
            y <= bottom
          );
        });
  
        if (isOverlapping) {
          selectedPaths.push(path);
        }
      }
    });
  
    // ✅ Include textboxes in selection
    textBoxesRef.current.forEach((box) => {
      const boxLeft = box.x;
      const boxRight = box.x + box.width;
      const boxTop = box.y;
      const boxBottom = box.y + box.height;
  
      if (
        boxLeft < right &&
        boxRight > left &&
        boxTop < bottom &&
        boxBottom > top
      ) {
        selectedPaths.push(box);
      }
    });
  
    // ✅ Include images in selection
    const selectedImages = imagesRef.current.filter(image =>
      left < image.x + image.width &&
      right > image.x &&
      top < image.y + image.height &&
      bottom > image.y
    );
  
    // ✅ Include notes in selection
    const selectedNotes = notesRef.current.filter(note =>
      left < note.x + note.width &&
      right > note.x &&
      top < note.y + note.height &&
      bottom > note.y
    );

  
    return [
      ...selectedPaths,
      ...selectedImages,
      ...selectedNotes,
    ];
  };

  const getBoundingBox = (paths) => {
    if (paths.length === 0) return null;
  
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
  
    paths.forEach((path) => {
      if (path.type === 'arrow' || path.type === 'line') {
        minX = Math.min(minX, path.startX, path.endX);
        minY = Math.min(minY, path.startY, path.endY);
        maxX = Math.max(maxX, path.startX, path.endX);
        maxY = Math.max(maxY, path.startY, path.endY);
      } else if (
        ['rectangle', 'circle', 'triangle', 'diamond', 'hexagon',
         'oval', 'trapezoid', 'star', 'cloud', 'heart', 'x-box', 'check-box']
        .includes(path.type)
      ) {
        minX = Math.min(minX, path.x);
        minY = Math.min(minY, path.y);
        maxX = Math.max(maxX, path.x + Math.abs(path.width));
        maxY = Math.max(maxY, path.y + Math.abs(path.height));
      } else if (path.type === 'draw') {
        path.points.forEach(({ x, y }) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });
      }
    });
  
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const resizeSelectedElements = (handleIndex, deltaX, deltaY) => {
    selectedElements.forEach((element) => {
      if (element.type === "arrow" || element.type === "line") {
        // Resizing for arrows and lines
        if (handleIndex === 0 || handleIndex === 2) { // Top-left or Bottom-left
          element.startX += deltaX;
          element.startY += deltaY;
        } else if (handleIndex === 1 || handleIndex === 3) { // Top-right or Bottom-right
          element.endX += deltaX;
          element.endY += deltaY;
        }
      } else if (element.type === "draw") {
        // Scaling all points within the "draw" element
        const box = getBoundingBox([element]); // Get current bounding box
  
        let scaleX = 1;
        let scaleY = 1;
        let offsetX = 0;
        let offsetY = 0;
  
        switch (handleIndex) {
          case 0: // Top-left
            scaleX = (box.width - deltaX) / box.width; // Shrink in X
            scaleY = (box.height - deltaY) / box.height; // Shrink in Y
            offsetX = deltaX; // Move the element in X direction
            offsetY = deltaY; // Move the element in Y direction
            console.log("Delta: ", deltaX, deltaY)
            break;
          case 1: // Top-right
            scaleX = (box.width + deltaX) / box.width; // Expand in X
            scaleY = (box.height - deltaY) / box.height; // Shrink in Y
            offsetY = deltaY; // Move the element in Y direction
            break;
          case 2: // Bottom-left
            scaleX = (box.width - deltaX) / box.width; // Shrink in X
            scaleY = (box.height + deltaY) / box.height; // Expand in Y
            offsetX = deltaX; // Move the element in X direction
            break;
          case 3: // Bottom-right
            scaleX = (box.width + deltaX) / box.width; // Expand in X
            scaleY = (box.height + deltaY) / box.height; // Expand in Y
            break;
          case 4: // Top-middle
            scaleY = (box.height - deltaY) / box.height; // Shrink in Y
            offsetY = deltaY; // Move the element in Y direction
            break;
          case 5: // Bottom-middle
            scaleY = (box.height + deltaY) / box.height; // Expand in Y
            break;
          case 6: // Left-middle
            scaleX = (box.width - deltaX) / box.width; // Shrink in X
            offsetX = deltaX; // Move the element in X direction
            break;
          case 7: // Right-middle
            scaleX = (box.width + deltaX) / box.width; // Expand in X
            break;
        }
  
        // Apply the scale to all points and adjust the position (x, y)
        element.points.forEach((point) => {
          point.x = (box.x + (point.x - box.x) * scaleX) + offsetX
          point.y = (box.y + (point.y - box.y) * scaleY) + offsetY
        });
  
      } else {
        // Resizing for standard shapes (rectangles, etc.)
        switch (handleIndex) {
          case 0: // Top-left
            element.x += deltaX;
            element.y += deltaY;
            element.width -= deltaX;
            element.height -= deltaY;
            break;
          case 1: // Top-right
            element.y += deltaY;
            element.width += deltaX;
            element.height -= deltaY;
            break;
          case 2: // Bottom-left
            element.x += deltaX;
            element.width -= deltaX;
            element.height += deltaY;
            break;
          case 3: // Bottom-right
            element.width += deltaX;
            element.height += deltaY;
            break;
          case 4: // Top-middle
            element.y += deltaY;
            element.height -= deltaY;
            break;
          case 5: // Bottom-middle
            element.height += deltaY;
            break;
          case 6: // Left-middle
            element.x += deltaX;
            element.width -= deltaX;
            break;
          case 7: // Right-middle
            element.width += deltaX;
            break;
        }
      }
    });
  
    // Update bounding box after resizing
    selectedBoxRef.current = getBoundingBox(selectedElements);
    redrawCanvas();
  };

  const drawArrow = (x1, y1, x2, y2, isSelected) => {
    const ctx = ctxRef.current;
  
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  
    if (isSelected) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
    }
  
    ctx.stroke();
  
    // Draw arrowhead
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLength = 10;
  
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
  
    if (isSelected) {
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "black";
    }
  
    ctx.fill();
  };

  const drawLine = (x1, y1, x2, y2, isSelected) => {
    const ctx = ctxRef.current;
  
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  
    if (isSelected) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
    }
  
    ctx.stroke();
  
    if (isSelected) {
      ctx.fillStyle = "blue";
    } else {
      ctx.fillStyle = "black";
    }
  
    ctx.fill();
  };

  const removePaths = (elements) => {
    pathsRef.current = pathsRef.current.filter(
      (path) => !elements.includes(path)
    );
  
    // ✅ Remove textboxes
    textBoxesRef.current = textBoxesRef.current.filter(
      (box) => !elements.includes(box)
    );

    imagesRef.current = imagesRef.current.filter(
      (image) => !elements.includes(image)
    );

    notesRef.current = notesRef.current.filter(
      (note) => !elements.includes(note)
    );

    redrawCanvas();
  };
  
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    // Adjust for border width
    const borderWidth = 5; // Match the border-width in your CSS
  
    const x = (e.clientX - rect.left - borderWidth - translationRef.current.x) / scaleRef.current;
    const y = (e.clientY - rect.top - borderWidth - translationRef.current.y) / scaleRef.current;
  
    return { offsetX: x, offsetY: y };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
  
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transforms for clearing
    ctx.clearRect(0, 0, canvas.width / scaleRef.current, canvas.height/scaleRef.current); // Clear dynamically based on transform

    ctx.setTransform(
      scaleRef.current,
      0,
      0,
      scaleRef.current,
      translationRef.current.x,
      translationRef.current.y
    );
    
    // ✅ Draw textboxes
    textBoxesRef.current.forEach((box) => {
      // Scale the position and dimensions
      const scaledX = box.x * scaleRef.current + translationRef.current.x; // REMOVE THESE LATER TO FIX THE SCALING
      const scaledY = box.y * scaleRef.current + translationRef.current.y;
      const scaledWidth = box.width * scaleRef.current;
      const scaledHeight = box.height * scaleRef.current;
    
      // Draw the textbox rectangle
      ctx.beginPath();
      ctx.rect(scaledX, scaledY, scaledWidth, scaledHeight);
    
      // Set transparency for hovered elements
      ctx.globalAlpha = hoveredElements.includes(box) ? 0.3 : 1.0;
    
      // Set stroke style based on selection
      ctx.strokeStyle = selectedElements.includes(box) ? "blue" : "black";
      ctx.lineWidth = selectedElements.includes(box) ? 2 : 1;
    
      ctx.stroke();
    
      // Render text inside the textbox
      ctx.font = `${15 * scaleRef.current}px Arial`; // Scale font size
      ctx.fillStyle = "black";
    
      if (!box.text.trim() && (!activeInput || box.id !== activeInput.id)) {
        // Display placeholder for empty textboxes
        ctx.fillStyle = "gray";
        ctx.fillText("Enter text...", scaledX + 4 * scaleRef.current, scaledY + 20 * scaleRef.current);
      } else {
        // Render text with letter spacing
        drawTextWithLetterSpacing(
          ctx,
          box.text,
          scaledX + 4 * scaleRef.current, // Adjust for scaling
          scaledY + 20 * scaleRef.current, // Adjust for scaling
          0.5 * scaleRef.current, // Scale letterSpacing
          20 * scaleRef.current, // Scale line height
          scaleRef.current
        );

        
      }
    });
  
    // ✅ Draw paths
    pathsRef.current.forEach((path) => {
      ctx.lineWidth = 10
      ctx.strokeStyle = selectedElements.includes(path) ? "blue" : "black";
      ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
      if (path.type === 'rectangle') {
        ctx.strokeRect(
          Math.min(path.x, path.x + path.width),
          Math.min(path.y, path.y + path.height),
          Math.abs(path.width),
          Math.abs(path.height)
        );
      } else if (path.type === 'circle') {
        const radius = Math.min(Math.abs(path.width), Math.abs(path.height)) / 2;
        if (radius > 0) {
          ctx.beginPath();
          ctx.arc(
            Math.min(path.x, path.x + path.width) + radius,
            Math.min(path.y, path.y + path.height) + radius,
            radius,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }
      } else if (path.type === 'triangle') {
        ctx.beginPath();
        ctx.moveTo(path.x + path.width / 2, path.y);
        ctx.lineTo(path.x, path.y + Math.abs(path.height));
        ctx.lineTo(path.x + Math.abs(path.width), path.y + Math.abs(path.height));
        ctx.closePath();
        ctx.stroke();
      } else if (path.type === 'diamond') {
        ctx.beginPath();
        ctx.moveTo(path.x + path.width / 2, path.y);
        ctx.lineTo(path.x + Math.abs(path.width), path.y + path.height / 2);
        ctx.lineTo(path.x + path.width / 2, path.y + Math.abs(path.height));
        ctx.lineTo(path.x, path.y + path.height / 2);
        ctx.closePath();
        ctx.stroke();
      } else if (path.type === 'hexagon') {
        const size = Math.min(Math.abs(path.width), Math.abs(path.height)) / 2;
        if (size > 0) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = path.x + Math.abs(path.width) / 2 + size * Math.cos(angle);
            const y = path.y + Math.abs(path.height) / 2 + size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (path.type === 'oval') {
        if (Math.abs(path.width) > 0 && Math.abs(path.height) > 0) {
          ctx.beginPath();
          ctx.ellipse(
            path.x + Math.abs(path.width) / 2,
            path.y + Math.abs(path.height) / 2,
            Math.abs(path.width) / 2,
            Math.abs(path.height) / 2,
            0,
            0,
            2 * Math.PI
          );
          ctx.stroke();
        }
      } else if (path.type === 'trapezoid') {
        ctx.beginPath();
        ctx.moveTo(path.x + Math.abs(path.width) * 0.25, path.y);
        ctx.lineTo(path.x + Math.abs(path.width) * 0.75, path.y);
        ctx.lineTo(path.x + Math.abs(path.width), path.y + Math.abs(path.height));
        ctx.lineTo(path.x, path.y + Math.abs(path.height));
        ctx.closePath();
        ctx.stroke();
      } else if (path.type === 'star') {
        const cx = path.x + Math.abs(path.width) / 2;
        const cy = path.y + Math.abs(path.height) / 2;
        const spikes = 5;
        const outerRadius = Math.min(Math.abs(path.width), Math.abs(path.height)) / 2;
        const innerRadius = outerRadius / 2;
        if (outerRadius > 0 && innerRadius > 0) {
          ctx.beginPath();
          for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI / spikes) * i;
            const x = cx + radius * Math.sin(angle);
            const y = cy - radius * Math.cos(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (path.type === 'cloud') {
        const x = path.x;
        const y = path.y;
        const w = Math.abs(path.width);
        const h = Math.abs(path.height);
      
        if (w > 0 && h > 0) {
          ctx.beginPath();
          ctx.moveTo(x + w * 0.25, y + h * 0.75);
          ctx.lineTo(x + w * 0.75, y + h * 0.75);
          ctx.arc(x + w * 0.75, y + h * 0.65, w * 0.1, Math.PI * 0.5, Math.PI * 1.5);
          ctx.arc(x + w * 0.65, y + h * 0.55, w * 0.15, Math.PI * 0.2, Math.PI * 1.5);
          ctx.arc(x + w * 0.5, y + h * 0.45, w * 0.2, Math.PI * 0.2, Math.PI * 1.8);
          ctx.arc(x + w * 0.35, y + h * 0.55, w * 0.15, Math.PI * 0.2, Math.PI * 1.5);
          ctx.arc(x + w * 0.25, y + h * 0.65, w * 0.1, Math.PI * 0.5, Math.PI * 1.5);
          ctx.closePath();
          ctx.stroke();
        }
      } else if (path.type === 'heart') {
        const cx = path.x + Math.abs(path.width) / 2;
        const cy = path.y + Math.abs(path.height) / 2;
        const topCurveHeight = Math.abs(path.height) * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy + Math.abs(path.height) / 4);
        ctx.bezierCurveTo(
          cx + Math.abs(path.width) / 2, cy - topCurveHeight,
          cx + Math.abs(path.width), cy + Math.abs(path.height) / 2,
          cx, cy + Math.abs(path.height)
        );
        ctx.bezierCurveTo(
          cx - Math.abs(path.width), cy + Math.abs(path.height) / 2,
          cx - Math.abs(path.width) / 2, cy - topCurveHeight,
          cx, cy + Math.abs(path.height) / 4
        );
        ctx.closePath();
        ctx.stroke();
      } else if (path.type === 'x-box') {
        ctx.strokeRect(path.x, path.y, path.width, path.height);
        ctx.beginPath();
        ctx.moveTo(path.x, path.y);
        ctx.lineTo(path.x + path.width, path.y + path.height);
        ctx.moveTo(path.x + path.width, path.y);
        ctx.lineTo(path.x, path.y + path.height);
        ctx.stroke();
      } else if (path.type === 'check-box') {
        ctx.strokeRect(path.x, path.y, path.width, path.height);
        ctx.beginPath();
        ctx.moveTo(path.x + path.width * 0.2, path.y + path.height * 0.5);
        ctx.lineTo(path.x + path.width * 0.4, path.y + path.height * 0.8);
        ctx.lineTo(path.x + path.width * 0.8, path.y + path.height * 0.2);
        ctx.stroke();
      } else if (path.type === 'arrow') {
        drawArrow(
          path.startX,
          path.startY,
          path.endX,
          path.endY,
          selectedElements.includes(path)
        );
      } else if (path.type === 'line') {
        ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
        drawLine(
          path.startX,
          path.startY,
          path.endX,
          path.endY,
          selectedElements.includes(path)
        );
      } else if (path[0]?.type === 'highlight') {
        ctx.beginPath();
        path.points.forEach(({ x, y }, index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
    
        ctx.globalAlpha = hoveredElements.includes(path) ? 0.1 : 0.4;
        if (selectedElements.includes(path)) {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 20;
        } else {
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 20;
        }
    
        ctx.stroke();
      } else if (path[0]?.type === 'laser') {
        const now = Date.now();
        path = path.filter((point) => now - point.time <= 3000); // Keep points within 3 seconds
    
        ctx.beginPath();
        path.forEach(({ x, y }, index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
    
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (path.type === 'draw') {
        ctx.beginPath();
        // ctx.strokeStyle = "black";
        path.points.forEach(({ x, y }, index) => {
          if (index === 0) { ctx.moveTo(x, y) } 
          else { ctx.lineTo(x, y); }
        })
        ctx.stroke();
      } 
    });

    imagesRef.current.forEach(image => {
      const img = new Image();
      img.src = image.src;
      img.onload = () => ctx.drawImage(img, image.x, image.y, image.width, image.height);

      if (hoveredElements.includes(image)) {
        ctx.globalAlpha = 0.5; // Set opacity to 50%
      } else {
        ctx.globalAlpha = 1; // Reset opacity
      }

      if (selectedElements.includes(image)) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        ctx.strokeRect(image.x, image.y, image.width, image.height);
      }
   });

    notesRef.current.forEach((note) => {
    if (hoveredElements.includes(note)) {
      ctx.globalAlpha = 0.3; // Transparent when erasing
    } 

    if (selectedElements.includes(note)) {
      ctx.strokeStyle = "blue"; // Blue when selected
      ctx.lineWidth = 5;
    } else {
      ctx.strokeStyle = "black";
      ctx.lineWidth = 5;
    }

    ctx.fillStyle = "yellow";
    ctx.fillRect(note.x, note.y, note.width, note.height);
    ctx.strokeRect(note.x, note.y, note.width, note.height);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    note.text.split("\n").forEach((line, i) => {
      ctx.fillText(line, note.x + 5, note.y + 20 + i * 20);
    });

  });

  if (selectedElements.length > 0) {
    const box = getBoundingBox(selectedElements);
    selectedBoxRef.current = box; // ✅ Update ref directly
    if (box) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);

        // Draw resize handles (corners & midpoints)
        const handleSize = 8;
        const resizeHandles = [
            { x: box.x, y: box.y }, // Top-left
            { x: box.x + box.width, y: box.y }, // Top-right
            { x: box.x, y: box.y + box.height }, // Bottom-left
            { x: box.x + box.width, y: box.y + box.height }, // Bottom-right
            { x: box.x + box.width / 2, y: box.y }, // Top-middle
            { x: box.x + box.width / 2, y: box.y + box.height }, // Bottom-middle
            { x: box.x, y: box.y + box.height / 2 }, // Left-middle
            { x: box.x + box.width, y: box.y + box.height / 2 } // Right-middle
        ];
        resizeHandles.forEach(handle => {
            ctx.fillStyle = "blue";
            ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
        });

        resizeHandlesRef.current = resizeHandles;
    }
}

  

  };

  const handleAssetTool = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            imagesRef.current.push({
                id: crypto.randomUUID(),
                x: 100, // Default position (can modify for placement logic)
                y: 100,
                width: img.width / 4, // Scale down for better canvas fit
                height: img.height / 4,
                src: img.src,
            });
            redrawCanvas();
        };
    };
    input.click();
  }

  const handleCreateNote = (x, y) => {
    const width = 150;
    const height = 150;

    const newNote = {
      id: Date.now(),
      x: x - (width / 2),
      y: y - (height / 2),
      width: width,
      height: height,
      text: "",
    };

    notesRef.current.push(newNote);
    redrawCanvas();
  }

  const handleDrawingShape = (e, shape) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
  
    const id = generateId(); // ✅ Generate unique ID
    setCurrentShapeId(id);
  
    // Add new shape to `pathsRef`
    pathsRef.current.push({
      id,
      type: shape,
      x,
      y,
      width: 0,
      height: 0,
    });
  }

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setStartPoint({ x: offsetX, y: offsetY });

    const EDGE_MARGIN = 10; // Margin of error for detecting edge clicks
    
    const box = selectedBoxRef.current;
    if (box) {
      const isOnLeftEdge = offsetX >= box.x - EDGE_MARGIN && offsetX <= box.x + EDGE_MARGIN;
      const isOnRightEdge = offsetX >= box.x + box.width - EDGE_MARGIN && offsetX <= box.x + box.width + EDGE_MARGIN;
      const isOnTopEdge = offsetY >= box.y - EDGE_MARGIN && offsetY <= box.y + EDGE_MARGIN;
      const isOnBottomEdge = offsetY >= box.y + box.height - EDGE_MARGIN && offsetY <= box.y + box.height + EDGE_MARGIN;

      
    
      if (isOnLeftEdge || isOnRightEdge || isOnTopEdge || isOnBottomEdge) {
        let direction = null;

        if (isOnLeftEdge && isOnTopEdge) direction = "top-left";
        else if (isOnRightEdge && isOnTopEdge) direction = "top-right";
        else if (isOnLeftEdge && isOnBottomEdge) direction = "bottom-left";
        else if (isOnRightEdge && isOnBottomEdge) direction = "bottom-right";
        else if (isOnTopEdge) direction = "top-middle";
        else if (isOnBottomEdge) direction = "bottom-middle";
        else if (isOnLeftEdge) direction = "left-middle";
        else if (isOnRightEdge) direction = "right-middle";
      
        if (direction) {
          setResizeDirection(direction); // Set which part of the box is being resized
          setActiveTool("resizing");
          return;
        }
      }
    
      // Check if clicked inside the box (not on edges)
      else if (
        offsetX >= box.x &&
        offsetX <= box.x + box.width &&
        offsetY >= box.y &&
        offsetY <= box.y + box.height
      ) {
        setActiveTool("dragging");
        return;
      }
    }

    if (activeInput) {
      handleInputBlur(null)
      setActiveInput(null)
      return
    }
    
    const clickedTextBox = textBoxesRef.current.find(
      (box) =>
        offsetX >= box.x &&
        offsetX <= box.x + box.width &&
        offsetY >= box.y &&
        offsetY <= box.y + box.height
    );

    const clickedNote = notesRef.current.find(
      (note) =>
        offsetX >= note.x &&
        offsetX <= note.x + note.width &&
        offsetY >= note.y &&
        offsetY <= note.y + note.height
    );

    if (clickedTextBox) {
      
      setActiveInput({...activeInput,
        x: clickedTextBox.x,
        y: clickedTextBox.y,
        width: clickedTextBox.width,
        height: clickedTextBox.height,
        text: clickedTextBox.text,
        id: clickedTextBox.id,
      });

      clickedTextBox.text = ""
      redrawCanvas()
      return
    }

    if (clickedNote) {
      setActiveInput({...activeInput,
        x: clickedNote.x,
        y: clickedNote.y,
        width: clickedNote.width,
        height: clickedNote.height,
        text: clickedNote.text,
        id: clickedNote.id,
      });

      return
    }

    setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
    setSelectedElements([]);

    switch (tool) {
      case "hand":
        setActiveTool("hand");
        break;
    
      case "select":
        setActiveTool("select");
        redrawCanvas();
        break;
    
      case "draw":
        setActiveTool("draw");
        pathsRef.current.push({
          id: generateId(),
          points: [{ x: offsetX, y: offsetY }],
          type: "draw"
        });
        break;
    
      case "arrow":
        setActiveTool("arrow");
        setStartPoint({ x: offsetX, y: offsetY });
        break;
    
      case "eraser":
        setActiveTool("eraser");
        setEraserBox({ left: e.clientX, top: e.clientY, width: 20, height: 20 });
        break;
    
      case "text":
        setActiveTool("text");
        setStartTextBox({ x: offsetX, y: offsetY });
        break;
    
      case "note":
        setActiveTool("note");
        handleCreateNote(offsetX, offsetY);
        handleToolChange(e, "select");
        break;
    
      case "rectangle":
      case "circle":
      case "triangle":
      case "diamond":
      case "hexagon":
      case "oval":
      case "trapezoid":
      case "star":
      case "cloud":
      case "heart":
      case "x-box":
      case "check-box":
        setActiveTool("shape");
        handleDrawingShape(e, tool);
        break;
    
      case "line":
        setActiveTool("line");
        setStartPoint({ x: offsetX, y: offsetY });
        break;
    
      case "highlighter":
        setActiveTool("highlighter");
        pathsRef.current.push([{ x: offsetX, y: offsetY, type: "highlight" }]);
        break;
    
      case "laser": {
        setActiveTool("laser");
        const point = { x: offsetX, y: offsetY, type: "laser", time: Date.now() };
        pathsRef.current.push([point]);
    
        const laserArray = pathsRef.current[pathsRef.current.length - 1];
    
        setTimeout(() => {
          laserArray.splice(laserArray.indexOf(point), 1);
          redrawCanvas();
        }, 500);
        break;
      }
    
      default:
        console.warn(`Unhandled tool: ${tool}`);
    }

       
  };

  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
  
    switch (activeTool) {
      case "dragging": {
        const adjustedDx = dx / scaleRef.current;
        const adjustedDy = dy / scaleRef.current;
      
        selectedElements.forEach((selectedPath) => {
          const path = pathsRef.current.find((p) => p.id === selectedPath.id);
          if (path) {
            if (path.type === "draw" || path.type === "highlight") {
              path.points = path.points.map(({ x, y }) => ({
                x: x + adjustedDx,
                y: y + adjustedDy,
              }));
            } else if (path.type === "arrow" || path.type === "line") {
              path.startX += adjustedDx;
              path.startY += adjustedDy;
              path.endX += adjustedDx;
              path.endY += adjustedDy;
            } else if (
              [
                "rectangle", "circle", "triangle", "diamond", "hexagon",
                "oval", "trapezoid", "star", "cloud", "heart", "x-box", "check-box"
              ].includes(path.type)
            ) {
              path.x += adjustedDx;
              path.y += adjustedDy;
            }
          }
        });
      
        setLastMousePos({ x: e.clientX, y: e.clientY });
        redrawCanvas();
        break;
      }

      case "resizing": {
        if (!resizeDirection || !selectedBoxRef.current) return;
      
        const dx = (e.clientX - lastMousePos.x) / scaleRef.current;
        const dy = (e.clientY - lastMousePos.y) / scaleRef.current;
      
        const handleIndexMap = {
          "top-left": 0,
          "top-right": 1,
          "bottom-left": 2,
          "bottom-right": 3,
          "top-middle": 4,
          "bottom-middle": 5,
          "left-middle": 6,
          "right-middle": 7,
        };
      
        const handleIndex = handleIndexMap[resizeDirection];
        console.log("Resizing with handle index:", handleIndex);
      
        if (handleIndex !== undefined) {
          resizeSelectedElements(handleIndex, dx, dy);
        }
      
        setLastMousePos({ x: e.clientX, y: e.clientY });
        redrawCanvas();
        break;
      }
      
      case "hand": {
        translationRef.current.x += dx;
        translationRef.current.y += dy;
  
        setLastMousePos({
          x: e.clientX,
          y: e.clientY,
        });
  
        redrawCanvas();
        break;
      }
  
      case "select": {
        const left = Math.min(e.clientX, lastMousePos.x);
        const top = Math.min(e.clientY, lastMousePos.y);
        const width = Math.abs(e.clientX - lastMousePos.x);
        const height = Math.abs(e.clientY - lastMousePos.y);
  
        setSelectionBox({ left, top, width, height });
  
        const selectedElements = findOverlappingPaths({ left, top, width, height });
        setSelectedElements(selectedElements);
  
        redrawCanvas();
        break;
      }
  
      case "draw": {
        const currentPath = pathsRef.current[pathsRef.current.length - 1].points;
        currentPath.push({ x: offsetX, y: offsetY });

        redrawCanvas();
        break;
      }
  
      case "arrow":
        redrawCanvas();
        drawArrow(startPoint.x, startPoint.y, offsetX, offsetY, false);
        break;
  
      case "eraser": {
        const width = 20;
        const height = 20;
        const left = e.clientX - width / 2;
        const top = e.clientY - height / 2;
  
        setEraserBox({ left, top, width, height });
  
        const overlappingElements = findOverlappingPaths({
          left,
          top,
          width,
          height,
        });
  
        setHoveredElements((prev) => [
          ...new Set([...prev, ...overlappingElements]),
        ]);
  
        redrawCanvas();
        break;
      }
  
      case "text": {
        const width = offsetX - startTextBox.x;
        const height = 30;
  
        redrawCanvas();
  
        const ctx = ctxRef.current;
        ctx.beginPath();
        ctx.rect(startTextBox.x, startTextBox.y, width, height);
        ctx.strokeStyle = "gray";
        ctx.stroke();
        break;
      }

      case "shape": {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - translationRef.current.x) / scaleRef.current;
        const y = (e.clientY - rect.top - translationRef.current.y) / scaleRef.current;
  
        const shape = pathsRef.current.find((p) => p.id === currentShapeId);
        if (shape) {
          shape.x = Math.min(startPoint.x, x);
          shape.y = Math.min(startPoint.y, y);
          shape.width = Math.abs(x - startPoint.x);
          shape.height = Math.abs(y - startPoint.y);
  
          redrawCanvas();
  
          // Draw the dashed rectangle
          const ctx = canvasRef.current.getContext('2d');
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'gray';
          ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
          ctx.setLineDash([]);
        }
        break;
      }
  
      case "line":
        redrawCanvas();
        drawLine(startPoint.x, startPoint.y, offsetX, offsetY, false);
        break;
  
      case "highlighter": {
        const currentPath = pathsRef.current[pathsRef.current.length - 1];
        currentPath.push({ x: offsetX, y: offsetY, type: "highlight" });
  
        redrawCanvas();
        break;
      }

      case "laser": {
        const point = { x: offsetX, y: offsetY, type: "laser", time: Date.now() };
        const currentPath = pathsRef.current[pathsRef.current.length - 1];
        currentPath.push(point);
  
        // Remove point after 3 seconds
        setTimeout(() => {
          currentPath.splice(currentPath.indexOf(point), 1);
          redrawCanvas();
        }, 500);
  
        redrawCanvas();
        break;
      }
  
      default:
        break;
    }

  };
  
  const handleMouseUp = (e) => {
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });

    switch (activeTool) {
      case "note":
      case "dragging":
      case "draw":
      case "highlighter":
        saveSnapshot()
        break;
        
      case "arrow": {
        const { offsetX, offsetY } = getMousePos(e);
    
        // Save the completed arrow to pathsRef
        pathsRef.current.push({
          id: generateId(),
          type: "arrow",
          startX: startPoint.x,
          startY: startPoint.y,
          endX: offsetX,
          endY: offsetY,
        });
    
        setStartPoint(null);
    
        redrawCanvas(); // ✅ Finalize the arrow on canvas
        saveSnapshot();
        break
      }
      
      case "line": {
        const { offsetX, offsetY } = getMousePos(e);
    
        // Save the completed arrow to pathsRef
        pathsRef.current.push({
          id: generateId(),
          type: "line",
          startX: startPoint.x,
          startY: startPoint.y,
          endX: offsetX,
          endY: offsetY,
        });
    
        setStartPoint(null);
    
        redrawCanvas(); // ✅ Finalize the arrow on canvas
        saveSnapshot();
      }
      
      case "eraser": {
        // Remove hovered elements from paths
        removePaths(hoveredElements);
        setHoveredElements([]);
        setEraserBox({ left: 0, top: 0, width: 0, height: 0 });
    
        redrawCanvas(); // Finalize the canvas state after erasure
        saveSnapshot();
        break;
      } 
      
      case "text": {
        const { offsetX, offsetY } = getMousePos(e);
        const width = offsetX - startTextBox.x;
        const height = 30;

        textBoxesRef.current.push({
          id: Date.now(), // Add unique ID
          x: startTextBox.x,
          y: startTextBox.y,
          width,
          height,
          text: "",
        });

        setStartTextBox(null);

        redrawCanvas();
        saveSnapshot();
        break;

      } 
      
      case "shape": 
        setCurrentShapeId(null);
        saveSnapshot();
        break;
      
  }

  setActiveTool(null);

  }

  const handleWheel = (e) => {
    // e.preventDefault();
  
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
  
    // Mouse position relative to the canvas BEFORE scaling
    const mouseX = (e.clientX - rect.left - translationRef.current.x) / scaleRef.current;
    const mouseY = (e.clientY - rect.top - translationRef.current.y) / scaleRef.current;
  
    // Scale amount (zoom in or out)
    const scaleAmount = e.deltaY < 0 ? 1.02 : 0.98;
    const newScale = scaleRef.current * scaleAmount;
  
    // Adjust translation so zooming is centered on the mouse position
    translationRef.current.x -= mouseX * (newScale - scaleRef.current);
    translationRef.current.y -= mouseY * (newScale - scaleRef.current);
  
    // Update the scale
    scaleRef.current = newScale;
  
    redrawCanvas();
  };
  
  const handleToolChange = (e, tool) => {
    e.preventDefault();
    if (tool == "asset") {
      handleAssetTool();
    } else if (tool == "save") {
      handleExport();
    } else if (tool == "load") {
      console.log("load");
      handleImport();
    }
    setTool(tool);

  };

  const handleInputChange = (e) => {
    const textarea = e.target;
  
    // Calculate the number of lines based on newlines in the text
    const lineHeight = 20; // Adjust this to match your textarea's line height
    const padding = 5; // Adjust this to match your textarea's padding
    const numLines = textarea.value.split("\n").length;
  
    // Calculate the new height based on the number of lines
    const newHeight = ((numLines * lineHeight) / scaleRef.current) + padding * 2;
    setActiveInput((prev) => ({
      ...prev,
      text: textarea.value,
      height: newHeight,
    }));
  
    // Find and update the textbox in textBoxesRef
    textBoxesRef.current = textBoxesRef.current.map((textbox) =>
      textbox.id === activeInput.id
        ? { ...textbox, height: newHeight }
        : textbox
    );
  

    redrawCanvas();
  };

  const handleInputBlur = () => {
    if (activeInput) {
      // ✅ Save the input value back into the textbox
      const updatedBoxes = textBoxesRef.current.map((box) =>
        box.id === activeInput.id
          ? { ...box, text: activeInput.text }
          : box
      );
      textBoxesRef.current = updatedBoxes;
      // setActiveInput(null);

      const updatedNotes = notesRef.current.map((note) =>
        note.id === activeInput.id
          ? { ...note, text: activeInput.text }
          : note
      );
      notesRef.current = updatedNotes;

      redrawCanvas();
    }
  };

  return (
    <div id="main-div">
      <canvas
        ref={canvasRef}
        id="whiteboard-canvas"
        style={{
          cursor: activeTool==="hand" ? "grabbing" : "default"
        }}
        width={1000}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
       {activeInput && (
        <textarea
          value={activeInput.text}
          onChange={handleInputChange}
          style={{
            position: "absolute",
            left: `${activeInput.x * scaleRef.current + translationRef.current.x + canvasRef.current.getBoundingClientRect().left + borderWidth}px`,
            top: `${activeInput.y * scaleRef.current + translationRef.current.y + canvasRef.current.getBoundingClientRect().top + borderWidth}px`,
            width: `${activeInput.width * scaleRef.current}px`,
            height: `${activeInput.height * scaleRef.current}px`,
            font: "16px Arial",
            padding: "4px",
            border: "0px solid black",
            zIndex: 10,
            background: "transparent",
            outline: "none",
            resize: "none",
            whiteSpace: "pre-wrap",
            lineHeight: "1.2",
            boxSizing: "border-box",
          }}
          autoFocus
        />
      )}
      <div
        id="selection-box"
        style={{
          position: "absolute",
          border: "1px dashed black",
          backgroundColor: "rgba(0, 0, 255, 0.1)",
          top: `${selectionBox.top}px`,
          left: `${selectionBox.left}px`,
          width: `${selectionBox.width}px`,
          height: `${selectionBox.height}px`,
          pointerEvents: "none",
        }}
      >
      </div>
      <div
        id="eraser-box"
        style={{
          position: "absolute",
          border: "1px dashed red",
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          borderRadius: "50%",
          top: `${eraserBox.top}px`,
          left: `${eraserBox.left}px`,
          width: `${eraserBox.width}px`,
          height: `${eraserBox.height}px`,
          pointerEvents: "none",
        }}
      ></div>
      <div id="tools-div">
        {[
          { displayName: "Select - V", toolName: "select", icon: selectIcon}, // done
          { displayName: "Hand - H", toolName: "hand", icon: handIcon }, // done
          { displayName: "Draw - D", toolName: "draw", icon: drawIcon }, // done
          { displayName: "Eraser - E", toolName: "eraser", icon: eraserIcon },
          { displayName: "Arrow - A", toolName: "arrow", icon: arrowIcon}, // done
          { displayName: "Text - T", toolName: "text", icon: textIcon },
          { displayName: "Note - N", toolName: "note", icon: noteIcon },
          { displayName: "Asset - U", toolName: "asset", icon: assetIcon },
          { displayName: "Rectangle - R", toolName: "rectangle", icon: rectangleIcon },
          { displayName: "Circle - C", toolName: "circle", icon: circleIcon },
          { displayName: "Triangle - Y", toolName: "triangle", icon: triangleIcon },
          { displayName: "Diamond", toolName: "diamond", icon: diamondIcon },
          { displayName: "Hexagon", toolName: "hexagon", icon: hexagonIcon },
          { displayName: "Oval", toolName: "oval", icon: ovalIcon },
          { displayName: "Trapezoid", toolName: "trapezoid", icon: trapezoidIcon },
          { displayName: "Star", toolName: "star", icon: starIcon },
          { displayName: "Cloud", toolName: "cloud", icon: cloudIcon },
          { displayName: "Heart", toolName: "heart", icon: heartIcon },
          // { displayName: "X-box", toolName: "x-box", icon: xboxIcon },
          // { displayName: "Check-box", toolName: "check-box", icon: checkBoxIcon },
          { displayName: "Line", toolName: "line", icon: lineIcon },
          { displayName: "Highlight", toolName: "highlighter", icon: highlighterIcon },
          { displayName: "Laser", toolName: "laser", icon: laserIcon },
          { displayName: "Frame", toolName: "frame", icon: frameIcon },
          // { displayName: "More", toolName: "more", icon: moreIcon },
          { displayName: "Save", toolName: "save", icon: "saveIcon" },
          { displayName: "Load", toolName: "load", icon: "loadIcon" },
        ].map((item) => (
          <div 
          key={item.toolName} 
          className="toolbox-item" 
          onClick={(e) => handleToolChange(e, item.toolName)}
          style={{
            backgroundColor: tool === item.toolName ? "lightblue" : "white",
          }}
          >
            <img src={item.icon} style={{
              width: "20px",
              height: "20px",
              objectFit: "contain",
            }}></img>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
