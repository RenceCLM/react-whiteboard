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

import { shapeDrawers } from "./shapes";

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
  const preloadedImagesRef = useRef({});

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

    console.log("Saving snapshot", undoStack.current);

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

  const getBoundingBox = (elements) => {
    if (elements.length === 0) return null;
  
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
  
    elements.forEach((element) => {
      if (element.type === 'arrow' || element.type === 'line') {
        // For arrows and lines
        minX = Math.min(minX, element.startX, element.endX);
        minY = Math.min(minY, element.startY, element.endY);
        maxX = Math.max(maxX, element.startX, element.endX);
        maxY = Math.max(maxY, element.startY, element.endY);
      } else if (
        ['rectangle', 'circle', 'triangle', 'diamond', 'hexagon',
         'oval', 'trapezoid', 'star', 'cloud', 'heart', 'x-box', 'check-box']
        .includes(element.type)
      ) {
        // For shapes
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + Math.abs(element.width));
        maxY = Math.max(maxY, element.y + Math.abs(element.height));
      } else if (element.type === 'draw' || element.type === 'highlight') {
        // For freehand drawings
        element.points.forEach(({ x, y }) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        });
      } else if (element.text !== undefined) {
        // For textboxes
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
      } else if (element.src !== undefined) {
        // For images
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
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
  
    // Reset and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width / scaleRef.current, canvas.height / scaleRef.current);
  
    // Apply current transform
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
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.globalAlpha = hoveredElements.includes(box) ? 0.3 : 1.0;
      ctx.strokeStyle = selectedElements.includes(box) ? "blue" : "white";
      ctx.lineWidth = selectedElements.includes(box) ? 2 : 1;
      ctx.stroke();
  
      // Draw text
      ctx.font = `${15 * scaleRef.current}px Arial`;
      ctx.fillStyle = box.text.trim() ? "black" : "gray";
  
      drawTextWithLetterSpacing(
        ctx,
        box.text || "Enter text...",
        box.x + 4, 
        box.y + 20,
        0.5,
        20,
        scaleRef.current
      );
    });
  
    // ✅ Draw paths using shapeDrawers
    pathsRef.current.forEach((path) => {
      ctx.lineWidth = 10;
      ctx.strokeStyle = selectedElements.includes(path) ? "blue" : "black";
      ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
      shapeDrawers[path.type]?.(ctx, path);
      console.log("Drawing path: ", path.type, path);
    });
  
    // ✅ Draw images with caching
    imagesRef.current.forEach((image) => {
      let img = preloadedImagesRef.current[image.src];
      if (!img) {
        img = new Image();
        img.src = image.src;
        img.onload = () => (preloadedImagesRef.current[image.src] = img);
      }
      if (img.complete) {
        ctx.globalAlpha = hoveredElements.includes(image) ? 0.5 : 1;
        ctx.drawImage(img, image.x, image.y, image.width, image.height);
      }
    });
  
    // ✅ Draw notes
    notesRef.current.forEach((note) => {
      ctx.globalAlpha = hoveredElements.includes(note) ? 0.3 : 1.0;
      ctx.fillStyle = "yellow";
      ctx.fillRect(note.x, note.y, note.width, note.height);
      ctx.strokeStyle = selectedElements.includes(note) ? "blue" : "black";
      ctx.lineWidth = 5;
      ctx.strokeRect(note.x, note.y, note.width, note.height);
  
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      note.text.split("\n").forEach((line, i) => {
        ctx.fillText(line, note.x + 5, note.y + 20 + i * 20);
      });
    });
  
    // ✅ Draw selection box & resize handles
    if (selectedElements.length > 0) {
      const box = getBoundingBox(selectedElements);
      if (box) {
        selectedBoxRef.current = box;
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);
  
        const handleSize = 8;
        const resizeHandles = [
          { x: box.x, y: box.y }, { x: box.x + box.width, y: box.y },
          { x: box.x, y: box.y + box.height }, { x: box.x + box.width, y: box.y + box.height },
          { x: box.x + box.width / 2, y: box.y }, { x: box.x + box.width / 2, y: box.y + box.height },
          { x: box.x, y: box.y + box.height / 2 }, { x: box.x + box.width, y: box.y + box.height / 2 }
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
      const inXRange = (val, target) => Math.abs(val - target) <= EDGE_MARGIN;
      const inYRange = (val, target) => Math.abs(val - target) <= EDGE_MARGIN;
      
      const isOnLeftEdge = inXRange(offsetX, box.x);
      const isOnRightEdge = inXRange(offsetX, box.x + box.width);
      const isOnTopEdge = inYRange(offsetY, box.y);
      const isOnBottomEdge = inYRange(offsetY, box.y + box.height);
      
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
    
    const findElementAtPosition = (elements, x, y) =>
      elements.find(({ x: ex, y: ey, width, height }) =>
        x >= ex && x <= ex + width && y >= ey && y <= ey + height
      );
    
    const clickedTextBox = findElementAtPosition(textBoxesRef.current, offsetX, offsetY);
    const clickedNote = findElementAtPosition(notesRef.current, offsetX, offsetY);
    

    if (clickedTextBox) {
      setActiveInput(prev => ({
        ...prev,
        ...clickedTextBox,
        text: "" 
      }));
      return;
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
      
        // Add a new arrow to pathsRef with its starting point
        pathsRef.current.push({
          id: generateId(), // Generate a unique ID for the arrow
          type: "arrow",
          startX: offsetX, // Starting X position
          startY: offsetY, // Starting Y position
          endX: offsetX,   // Initialize endX to the same as startX
          endY: offsetY,   // Initialize endY to the same as startY
        });
      
        setStartPoint({ x: offsetX, y: offsetY }); // Track the starting point
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
        const point = { x: offsetX, y: offsetY, type: "highlight" }


        // Add the highlight point to a dedicated highlight path
        if (!pathsRef.current.some((path) => path.type === "highlight")) {
          pathsRef.current.push({ type: "highlight", points: [] });
        }    

        const highlightPath = pathsRef.current.find((path) => path.type === "highlight");
        highlightPath.points.push(point);

        break;
    
      case "laser": {
        setActiveTool("laser");
        const point = { x: offsetX, y: offsetY, type: "laser", time: Date.now() };

        // Add the laser point to a dedicated laser path
        if (!pathsRef.current.some((path) => path.type === "laser")) {
          pathsRef.current.push({ type: "laser", points: [] });
        }    

        const laserPath = pathsRef.current.find((path) => path.type === "laser");
        laserPath.points.push(point);

        // Remove the laser point after 500ms
        setTimeout(() => {
          const index = laserPath.points.indexOf(point);
          if (index !== -1) {
            laserPath.points.splice(index, 1);
            redrawCanvas(); // Redraw the canvas after removing the point
          }
        }, 500);

        break;
      }
    
      default:
        console.warn(`Unhandled tool: ${tool}`);
    }

       
  }
  
  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
  
    switch (activeTool) {
      case "dragging": {
        const adjustedDx = dx / scaleRef.current;
        const adjustedDy = dy / scaleRef.current;

        const selectedMap = new Map(selectedElements.map(el => [el.id, el]));
  
        selectedElements.forEach(selectedElement => {
        const element = selectedMap.get(selectedElement.id);
        if (!element) return;

        if (element.type === "draw" || element.type === "highlight") {
          element.points.forEach(point => {
            point.x += adjustedDx;
            point.y += adjustedDy;
          });
        } else if (element.type === "arrow" || element.type === "line") {
          element.startX += adjustedDx;
          element.startY += adjustedDy;
          element.endX += adjustedDx;
          element.endY += adjustedDy;
        } else {
          element.x += adjustedDx;
          element.y += adjustedDy;
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
        const currentArrow = pathsRef.current[pathsRef.current.length - 1];

        if (currentArrow && currentArrow.type === "arrow") {
          currentArrow.endX = offsetX;
          currentArrow.endY = offsetY;
        
          redrawCanvas();
        }

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
        const point = { x: offsetX, y: offsetY, type: "highlight" }
        const highlightPath = pathsRef.current.find((path) => path.type === "highlight");
        highlightPath.points.push(point);
  
        redrawCanvas();
        break;
      }

      case "laser": {
        const point = { x: offsetX, y: offsetY, type: "laser", time: Date.now() };
        const laserPath = pathsRef.current.find((path) => path.type === "laser");
        laserPath.points.push(point);
  
        // Remove the laser point after 500ms
        setTimeout(() => {
          const index = laserPath.points.indexOf(point);
          if (index !== -1) {
            laserPath.points.splice(index, 1);
            redrawCanvas(); // Redraw the canvas after removing the point
          }
        }, 500);

        redrawCanvas(); // Redraw the canvas to show the new laser point
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
          type: "text",
          x: startTextBox.x,
          y: startTextBox.y,
          width,
          height,
          text: "",
        });

      
        setActiveInput({...activeInput,
          x: startTextBox.x,
          y: startTextBox.y,
          width: width,
          height: height,
          text: "",
          id: Date.now()
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
  
    // Get the canvas context to measure text width
    const ctx = ctxRef.current;
    ctx.font = `${18 * scaleRef.current}px Arial`; // Match the font size to the textarea
  
    // Calculate the number of lines based on newlines in the text
    const lineHeight = 20; // Adjust this to match your textarea's line height
    const padding = 5; // Adjust this to match your textarea's padding
    const numLines = textarea.value.split("\n").length;
  
    // Calculate the new height based on the number of lines
    const newHeight = (numLines * lineHeight) / scaleRef.current + padding * 2;
  
    // Calculate the maximum width of the text
    const lines = textarea.value.split("\n");
    const maxLineWidth = Math.max(...lines.map((line) => ctx.measureText(line).width));
    const newWidth = Math.max(activeInput.width, maxLineWidth / scaleRef.current + padding * 2);
  
    // Update the active input state
    setActiveInput((prev) => ({
      ...prev,
      text: textarea.value,
      height: newHeight,
      width: newWidth, 
    }));
  
    // Find and update the textbox in textBoxesRef
    textBoxesRef.current = textBoxesRef.current.map((textbox) =>
      textbox.id === activeInput.id
        ? { ...textbox, height: newHeight, width: newWidth }
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
            border: "1px solid blue",
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
