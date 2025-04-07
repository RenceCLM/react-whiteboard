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

import { shapeDrawers } from "./shapes";

const toolsList = {
  select: { toolName: "select", shortcut: "V", icon: selectIcon },
  hand: { toolName: "hand", shortcut: "H", icon: handIcon },
  draw: { toolName: "draw", shortcut: "D", icon: drawIcon },
  eraser: { toolName: "eraser", shortcut: "E", icon: eraserIcon },
  arrow: { toolName: "arrow", shortcut: "A", icon: arrowIcon },
  text: { toolName: "text", shortcut: "T", icon: textIcon },
  note: { toolName: "note", shortcut: "N", icon: noteIcon },
  asset: { toolName: "asset", shortcut: "⌘U", icon: assetIcon },
  rectangle: { toolName: "rectangle", icon: rectangleIcon },
  circle: { toolName: "circle", icon: circleIcon },
  triangle: { toolName: "triangle", icon: triangleIcon },
  diamond: { toolName: "diamond", icon: diamondIcon },
  hexagon: { toolName: "hexagon", icon: hexagonIcon },
  oval: { toolName: "oval", icon: ovalIcon },
  trapezoid: { toolName: "trapezoid", icon: trapezoidIcon },
  star: { toolName: "star", icon: starIcon },
  cloud: { toolName: "cloud", icon: cloudIcon },
  heart: { toolName: "heart", icon: heartIcon },
  line: { toolName: "line", shortcut: "L", icon: lineIcon },
  highlighter: { toolName: "highlighter", shortcut: "⌘D", icon: highlighterIcon },
  laser: { toolName: "laser", shortcut: "K", icon: laserIcon },
  frame: { toolName: "frame", shortcut: "F", icon: frameIcon },
  save: { toolName: "save", shortcut: "S", icon: "saveIcon" },
  load: { toolName: "load", icon: "loadIcon" },
  // { displayName: "X-box", toolName: "x-box", icon: xboxIcon },
  // { displayName: "Check-box", toolName: "check-box", icon: checkBoxIcon },
  // { displayName: "More", toolName: "more", icon: moreIcon },
};

// Dynamically add displayName to each tool
Object.keys(toolsList).forEach((key) => {
  const tool = toolsList[key];
  tool.displayName = tool.shortcut
    ? `${tool.toolName} - ${tool.shortcut}`
    : tool.toolName;
});


function App() {
  const [_, setForceRender] = useState(0); // Dummy state to trigger re-renders

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const translationRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const [tool, setTool] = useState("select");
  const [hoveredTool, setHoveredTool] = useState(null); // Track the hovered tool
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 }); // Track tooltip position
  const [activeTool, setActiveTool] = useState(null);

  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  })

  const selectedBoxRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const [eraserBox, setEraserBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const selectedElementsRef = useRef([])
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

  // Add shortcut letters to tools
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Loop through toolsList to find a matching shortcut
      Object.values(toolsList).forEach((tool) => {
        if (tool.shortcut && e.key.toUpperCase() === tool.shortcut.toUpperCase()) {
          setTool(tool.toolName); // Set the tool if the shortcut matches
        }
      });
    };
  
    window.addEventListener("keydown", handleKeyDown);
  
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    }, []);

  const handleMouseEnterTool = (toolName) => {
    setHoveredTool(toolName); // Set the hovered tool name
  };

  const handleMouseMoveTool = (e) => {
    setTooltipPosition({ x: e.clientX, y: e.clientY + 20 }); // Position tooltip slightly below the cursor
  };

  const handleMouseLeaveTool = () => {
    setHoveredTool(null); // Clear the hovered tool name
  };

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
    selectedElementsRef.current.forEach((element) => {
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
    selectedBoxRef.current = getBoundingBox(selectedElementsRef.current);
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



  const drawTextBoxes = (ctx) => {
   // ✅ Draw textboxes
   textBoxesRef.current.forEach((box) => {
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.globalAlpha = hoveredElements.includes(box) ? 0.3 : 1;
    ctx.strokeStyle = selectedElementsRef.current.includes(box) ? "blue" : "white";
    ctx.lineWidth = selectedElementsRef.current.includes(box) ? 2 : 1;
    ctx.stroke();

    // Draw text
    ctx.globalAlpha = selectedElementsRef.current.includes(box) ? box.transparency * 0.3 : box.transparency;
    ctx.font = `${box.fontSize * scaleRef.current}px ${box.font}`;
    ctx.fillStyle = box.text.trim() ? box.color : "gray";

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
  }

  const drawPaths = (ctx) => {
    pathsRef.current.forEach((path) => {
      ctx.lineWidth = 10;
      ctx.strokeStyle = selectedElementsRef.current.includes(path) ? "blue" : "black";
      ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
  
      if (path.type === "arrow") {
        console.log("Drawing Arrow", path);
  
        // Get the center of the fromElement and toElement, if they exist
        const fromCenter = path.fromElement ? getElementCenterById(path.fromElement) : null;
        const toCenter = path.toElement ? getElementCenterById(path.toElement) : null;
  
        // Fallback to startX and endX if no element is connected
        const startX = fromCenter ? fromCenter.x : path.startX;
        const startY = fromCenter ? fromCenter.y : path.startY;
        const endX = toCenter ? toCenter.x : path.endX;
        const endY = toCenter ? toCenter.y : path.endY;
  
        // Use shapeDrawers to draw the arrow
        shapeDrawers["arrow"](ctx, { ...path, startX, startY, endX, endY });
      } else {
        // Use shapeDrawers for other path types
        shapeDrawers[path.type]?.(ctx, path);
      }
    });
  };

  const drawImages = (ctx) => {
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
  }

  const drawNotes = (ctx) => {
    // ✅ Draw notes
    notesRef.current.forEach((note) => {
      ctx.globalAlpha = hoveredElements.includes(note) ? 0.3 : 1.0;
      ctx.fillStyle = "yellow";
      ctx.fillRect(note.x, note.y, note.width, note.height);
      ctx.strokeStyle = selectedElementsRef.current.includes(note) ? "blue" : "black";
      ctx.lineWidth = 5;
      ctx.strokeRect(note.x, note.y, note.width, note.height);
  
      ctx.fillStyle = "black";
      ctx.font = "16px Arial";
      note.text.split("\n").forEach((line, i) => {
        ctx.fillText(line, note.x + 5, note.y + 20 + i * 20);
      });
    });
  }

  const drawSelectedBox = (ctx) => {
    const box = getBoundingBox(selectedElementsRef.current);
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


  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
  
    // Reset and clear the entire canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    // Calculate the scaled dimensions
    const scaledWidth = canvas.width / scaleRef.current;
    const scaledHeight = canvas.height / scaleRef.current;
  
    // Clear the scaled area to ensure no artifacts remain
    ctx.clearRect(-translationRef.current.x, -translationRef.current.y, scaledWidth, scaledHeight);
  
    // Apply the current transform
    ctx.setTransform(
      scaleRef.current,
      0,
      0,
      scaleRef.current,
      translationRef.current.x,
      translationRef.current.y
    );
  
    // Redraw all elements
    drawTextBoxes(ctx);
    drawImages(ctx);
    drawPaths(ctx);
    drawNotes(ctx);
  
    // Draw selection box if elements are selected
    if (selectedElementsRef.current.length > 0) {
      drawSelectedBox(ctx);
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

  const getElementCenter = (element) => {
    if (element.type === "arrow" || element.type === "line") {
      return {
        x: (element.startX + element.endX) / 2,
        y: (element.startY + element.endY) / 2,
      };
    } else if (element.points) {
      // For freehand drawings, calculate the bounding box center
      const minX = Math.min(...element.points.map((p) => p.x));
      const maxX = Math.max(...element.points.map((p) => p.x));
      const minY = Math.min(...element.points.map((p) => p.y));
      const maxY = Math.max(...element.points.map((p) => p.y));
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    } else {
      // For rectangles, images, textboxes, and notes
      return {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      };
    }
  };

  const getElementCenterById = (id) => {
    const allElements = [
      ...pathsRef.current,
      ...textBoxesRef.current,
      ...imagesRef.current,
      ...notesRef.current,
    ];
    const element = allElements.find((el) => el.id === id);
    return element ? getElementCenter(element) : null;
  };

  const findElementAtPosition = (elements, x, y) =>
    elements.find(({ x: ex, y: ey, width, height }) =>
      x >= ex && x <= ex + width && y >= ey && y <= ey + height
  );


  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setStartPoint({ x: offsetX, y: offsetY });
    // Check if clicked on an image
    const clickedImage = findElementAtPosition(imagesRef.current, offsetX, offsetY)
    const clickedTextBox = findElementAtPosition(textBoxesRef.current, offsetX, offsetY);
    const clickedNote = findElementAtPosition(notesRef.current, offsetX, offsetY);
    const clickedPath = null // figure out how to see if user clicked on a path
    const box = selectedBoxRef.current;

  
    const EDGE_MARGIN = 10; // Margin of error for detecting edge clicks
  
    if (e.button === 2) {
      setTool("hand")
    }

    // if clicked on canvas
    if (!(clickedImage || clickedTextBox || clickedNote || box )) {
      selectedBoxRef.current = null
      selectedElementsRef.current = []
    }

    // clears textbox editing
    if (activeInput) {
      handleInputBlur(null);
      setActiveInput(null);
      return;
    }

    console.log("There is a box?", selectedBoxRef.current)


    if (box) {
      const inXRange = (val, target) => Math.abs(val - target) <= EDGE_MARGIN;
      const inYRange = (val, target) => Math.abs(val - target) <= EDGE_MARGIN;
  
      const isOnLeftEdge = inXRange(offsetX, box.x);
      const isOnRightEdge = inXRange(offsetX, box.x + box.width);
      const isOnTopEdge = inYRange(offsetY, box.y);
      const isOnBottomEdge = inYRange(offsetY, box.y + box.height);
  
      // Check if on edges and setTool "resize"
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
        console.log("Setting tool to dragging")
        return;
      }
    }
    
    if (clickedImage && tool !== "arrow") {
      console.log("clickedImage and setting selectedElements")
      selectedElementsRef.current = [clickedImage] // Select the clicked image
      redrawCanvas()
      return;
    }
  
    if (clickedTextBox && tool !=="arrow") {
      setActiveInput((prev) => ({
        ...prev,
        ...clickedTextBox,
        text: clickedTextBox.text,
      }));
      
      // Make the text of the selected Textbox " " then redraw the canvas
      textBoxesRef.current = textBoxesRef.current.map((box) =>
        box.id === clickedTextBox.id
          ? { ...box, text: " "}
          : box
      );

      redrawCanvas()
      return;
    }
  
    if (clickedNote && tool !=="arrow") {
      setActiveInput({
        ...activeInput,
        x: clickedNote.x,
        y: clickedNote.y,
        width: clickedNote.width,
        height: clickedNote.height,
        text: clickedNote.text,
        id: clickedNote.id,
      });
  
      return;
    }
  
    setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 })
    selectedElementsRef.current = [];
  
    
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
          type: "draw",
        });
        break;
  
      case "arrow":

        const clickedElement =
        // findElementAtPosition(pathsRef.current, offsetX, offsetY) || THIS DOESNT WORK ON PATHS
        findElementAtPosition(imagesRef.current, offsetX, offsetY) ||
        findElementAtPosition(textBoxesRef.current, offsetX, offsetY) ||
        findElementAtPosition(notesRef.current, offsetX, offsetY);

        console.log("Start arrow, clicked element: ", clickedElement)


        let fromElement = null
        let startX = offsetX;
        let startY = offsetY;
      
        if (clickedElement) {
          const center = getElementCenter(clickedElement);
          startX = center.x;
          startY = center.y;
          fromElement = clickedElement.id
        }
        
        setActiveTool("arrow");
  
        // Add a new arrow to pathsRef with its starting point
        pathsRef.current.push({
          id: generateId(), // Generate a unique ID for the arrow
          type: "arrow",
          fromElement: fromElement,
          toElement: null,
          startX: startX, // Starting X position
          startY: startY, // Starting Y position
          endX: startX, // Initialize endX to the same as startX
          endY: startY, // Initialize endY to the same as startY
        });
  
        setStartPoint({ x: startX, y: startY }); // Track the starting point
        break;
  
      case "line":
        setActiveTool("line");
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
  

      case "highlighter":
        setActiveTool("highlighter");
        const point = { x: offsetX, y: offsetY, type: "highlight" };
  
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
  };

  const handleMouseMove = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
  
    switch (activeTool) {
      case "dragging": {
        const adjustedDx = dx / scaleRef.current;
        const adjustedDy = dy / scaleRef.current;

        const selectedMap = new Map(selectedElementsRef.current.map(el => [el.id, el]));
  
        selectedElementsRef.current.forEach(selectedElement => {
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
  
        setSelectionBox({ left, top, width, height })
  
        const selectedElements = findOverlappingPaths({ left, top, width, height });
        selectedElementsRef.current = selectedElements
  
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
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 })

    switch (activeTool) {
      case "note":
      case "dragging":
      case "draw":
      case "highlighter":
        saveSnapshot()
        break;
        
      case "arrow": {
        const { offsetX, offsetY } = getMousePos(e);
      
        const clickedElement =
          findElementAtPosition(pathsRef.current, offsetX, offsetY) ||
          findElementAtPosition(imagesRef.current, offsetX, offsetY) ||
          findElementAtPosition(textBoxesRef.current, offsetX, offsetY) ||
          findElementAtPosition(notesRef.current, offsetX, offsetY);
      
        let toElement = null;
        let endX = offsetX;
        let endY = offsetY;
      
        if (clickedElement) {
          const center = getElementCenter(clickedElement);
          endX = center.x;
          endY = center.y;
          toElement = clickedElement.id; // Store the ID of the ending element
        }
      
        const currentArrow = pathsRef.current[pathsRef.current.length - 1];
        if (currentArrow && currentArrow.type === "arrow") {
          currentArrow.endX = endX;
          currentArrow.endY = endY;
          currentArrow.toElement = toElement; // Update the ending element ID
        }
      
        setStartPoint(null);
        redrawCanvas();
        saveSnapshot();
        break;
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
          color: "#000000",
          transparency: 100,
          font: "Arial",
          fontSize: 16,
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
    const textarea = e.target
  
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
        ? { ...textbox, text: " ",  height: newHeight, width: newWidth } // Update the textbox with new dimensions, also text " " to remove flavor text
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
        onContextMenu={(e) => {e.preventDefault()}}
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
            font: `${15 * scaleRef.current}px Arial`,
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
        id="elementsSettingsPanel"
        style={{
          position: "absolute",
          right: "50px",
          top: "10px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          padding: "10px",
          borderRadius: "10px",
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
          width: "200px",
        }}
      >
        {selectedElementsRef.current.length === 1 ? (
          // Show settings for the selected element
          (() => {
            const selectedElement = selectedElementsRef.current[0];
            switch (selectedElement.type) {
              case "text":
                return (
                  <>
                    <div id="colorPanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Text Color</h4>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)", // 4 columns
                          gap: "10px",
                        }}
                      >
                        {[
                          "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                          "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                          "#808080", "#000000", "#FFFFFF", "custom",
                        ].map((color, index) => (
                          <button
                            key={index}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: color === "custom" ? "#ccc" : color,
                              border: "2px solid #ccc",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            onClick={() => {
                              if (color === "custom") {
                                const colorPicker = document.createElement("input");
                                colorPicker.type = "color";
                                colorPicker.style.position = "absolute";
                                colorPicker.style.opacity = "0";
                                document.body.appendChild(colorPicker);
                                colorPicker.click();
                                colorPicker.oninput = (e) => {
                                  const newColor = e.target.value;
                    
                                  // Update the color in textBoxesRef immutably
                                  textBoxesRef.current = textBoxesRef.current.map((textbox) =>
                                    textbox.id === selectedElement.id
                                      ? { ...textbox, color: newColor }
                                      : textbox
                                  );
                    
                                  // Update the selected element reference immutably
                                  selectedElementsRef.current = selectedElementsRef.current.map((element) =>
                                    element.id === selectedElement.id
                                      ? { ...element, color: newColor }
                                      : element
                                  );
                    
                                  // Trigger a re-render
                                  setForceRender((prev) => prev + 1);
                                  redrawCanvas();
                    
                                  document.body.removeChild(colorPicker);
                                };
                              } else {
                                // Update the color directly
                                textBoxesRef.current = textBoxesRef.current.map((textbox) =>
                                  textbox.id === selectedElement.id
                                    ? { ...textbox, color: color }
                                    : textbox
                                );
                    
                                selectedElementsRef.current = selectedElementsRef.current.map((element) =>
                                  element.id === selectedElement.id
                                    ? { ...element, color: color }
                                    : element
                                );
                    
                                setForceRender((prev) => prev + 1);
                                redrawCanvas();
                              }
                            }}
                          >
                            {color === "custom" && "+"} {/* Show "+" for the custom color button */}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div id="transparencyPanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Transparency</h4>
                      <input
                        type="range"
                        value={selectedElement.transparency || 1} // Default to fully opaque
                        min="0.01"
                        max="1"
                        step="0.01"
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          const newTransparency = parseFloat(e.target.value);
                    
                          // Update the transparency in textBoxesRef immutably
                          textBoxesRef.current = textBoxesRef.current.map((textbox) =>
                            textbox.id === selectedElement.id
                              ? { ...textbox, transparency: newTransparency }
                              : textbox
                          );
                    
                          // Update the selected element reference immutably
                          selectedElementsRef.current = selectedElementsRef.current.map((element) =>
                            element.id === selectedElement.id
                              ? { ...element, transparency: newTransparency }
                              : element
                          );
                    
                          // Trigger a re-render
                          setForceRender((prev) => prev + 1);
                          redrawCanvas();
                        }}
                      />
                    </div>
                    <div id="fontPanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Font</h4>
                      <select
                        value={selectedElement.font} // Show the current font
                        style={{
                          width: "100%",
                          padding: "5px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                        }}
                        onChange={(e) => {
                          const newFont = e.target.value;
              
                          // Update the font in textBoxesRef immutably
                          textBoxesRef.current = textBoxesRef.current.map((textbox) =>
                            textbox.id === selectedElement.id
                              ? { ...textbox, font: newFont }
                              : textbox
                          );
              
                          // Update the selected element reference immutably
                          selectedElementsRef.current = selectedElementsRef.current.map((element) =>
                            element.id === selectedElement.id
                              ? { ...element, font: newFont }
                              : element
                          );
              
                          // Trigger a re-render
                          setForceRender((prev) => prev + 1);
                          redrawCanvas();
                        }}
                      >
                        {/* List of common fonts */}
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Lucida Console">Lucida Console</option>
                        <option value="Tahoma">Tahoma</option>
                        <option value="Trebuchet MS">Trebuchet MS</option>
                        <option value="Impact">Impact</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                        <option value="Palatino Linotype">Palatino Linotype</option>
                        <option value="Garamond">Garamond</option>
                        <option value="Bookman">Bookman</option>
                        <option value="Candara">Candara</option>
                        <option value="Arial Black">Arial Black</option>
                        <option value="Segoe UI">Segoe UI</option>
                      </select>
                    </div>
                    <div id="fontSizePanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Font Size</h4>
                      <input
                        type="number"
                        value={selectedElement.fontSize} // Show the current font size
                        min="1"
                        max="10000"
                        style={{
                          width: "100%",
                          padding: "5px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                        }}
                        onChange={(e) => {
                          const newFontSize = parseInt(e.target.value, 10);
              
                          // Update the font size in textBoxesRef immutably
                          textBoxesRef.current = textBoxesRef.current.map((textbox) =>
                            textbox.id === selectedElement.id
                              ? { ...textbox, fontSize: newFontSize }
                              : textbox
                          );
              
                          // Update the selected element reference
                          selectedElementsRef.current = selectedElementsRef.current.map((element) =>
                            element.id === selectedElement.id
                              ? { ...element, fontSize: newFontSize }
                              : element
                          );
              
                          // Trigger a re-render
                          setForceRender((prev) => prev + 1);
                          redrawCanvas();
                        }}
                      />
                    </div>

                  </>
                );          
              case "note":
                return (
                  <>
                    <div id="fontPanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Font</h4>
                      <input
                        type="text"
                        placeholder="Arial"
                        style={{
                          width: "100%",
                          padding: "5px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                        }}
                        onChange={(e) => console.log(`Selected font: ${e.target.value}`)}
                      />
                    </div>
                    <div id="textAlignmentPanel">
                      <h4 style={{ margin: "5px 0" }}>Text Alignment</h4>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        {["left", "center", "right", "justify"].map((align) => (
                          <button
                            key={align}
                            style={{
                              width: "40px",
                              height: "40px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "5px",
                              border: "1px solid #ccc",
                              backgroundColor: "#f9f9f9",
                              cursor: "pointer",
                            }}
                            onClick={() => console.log(`Selected alignment: ${align}`)}
                          >
                            {align.charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                );
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
              case "line":
              case "arrow":
                return (
                  <>
                    <div id="colorPanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Colors</h4>
                      <div 
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: "10px",
                        }}
                      >
                        {[
                          "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                          "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                          "#808080", "#000000", "#FFFFFF", "custom",
                        ].map((color) => (
                          <button
                            key={color}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              backgroundColor: color === "custom" ? "#ccc" : color,
                              border: "2px solid #ccc",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              if (color === "custom") {
                                const colorPicker = document.createElement("input");
                                colorPicker.type = "color";
                                colorPicker.style.position = "absolute";
                                colorPicker.style.opacity = "0";
                                document.body.appendChild(colorPicker);
                                colorPicker.click();
                                colorPicker.oninput = (e) => {
                                  console.log(`Selected custom color: ${e.target.value}`);
                                  document.body.removeChild(colorPicker);
                                };
                              } else {
                                console.log(`Selected color: ${color}`);
                              }
                            }}
                          >
                            {color === "custom" && "+"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div id="sizePanel" style={{ marginBottom: "15px" }}>
                      <h4 style={{ margin: "5px 0" }}>Size</h4>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        defaultValue="16"
                        style={{
                          width: "100%",
                          padding: "5px",
                          borderRadius: "5px",
                          border: "1px solid #ccc",
                        }}
                        onChange={(e) => console.log(`Selected size: ${e.target.value}`)}
                      />
                    </div>
                  </>
                );
              default:
                return null;
            }
          })()
        ) : (
          // Show settings based on the current tool
          <>
            {["draw", "arrow", "line", "text", "note", "rectangle", "circle", "triangle", "diamond", "hexagon", "oval", "trapezoid", "star", "cloud", "heart", "highlighter"].includes(tool) && (
              <div id="colorPanel" style={{ marginBottom: "15px" }}>
                <h4 style={{ margin: "5px 0" }}>Colors</h4>
                <div 
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "10px",
                  }}
                >
                  {[
                    "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
                    "#FF00FF", "#00FFFF", "#FFA500", "#800080",
                    "#808080", "#000000", "#FFFFFF", "custom",
                  ].map((color) => (
                    <button
                      key={color}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: color === "custom" ? "#ccc" : color,
                        border: "2px solid #ccc",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        if (color === "custom") {
                          const colorPicker = document.createElement("input");
                          colorPicker.type = "color";
                          colorPicker.style.position = "absolute";
                          colorPicker.style.opacity = "0";
                          document.body.appendChild(colorPicker);
                          colorPicker.click();
                          colorPicker.oninput = (e) => {
                            console.log(`Selected custom color: ${e.target.value}`);
                            document.body.removeChild(colorPicker);
                          };
                        } else {
                          console.log(`Selected color: ${color}`);
                        }
                      }}
                    >
                      {color === "custom" && "+"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {["draw", "arrow", "line", "text", "note", "rectangle", "circle", "triangle", "diamond", "hexagon", "oval", "trapezoid", "star", "cloud", "heart", "highlighter"].includes(tool) && (
              <div id="sizePanel" style={{ marginBottom: "15px" }}>
                <h4 style={{ margin: "5px 0" }}>Size</h4>
                <input
                  type="number"
                  min="1"
                  max="100"
                  defaultValue="16"
                  style={{
                    width: "100%",
                    padding: "5px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                  onChange={(e) => console.log(`Selected size: ${e.target.value}`)}
                />
              </div>
            )}
          </>
        )}
      </div>
      <div
        id="zoom-div"
        style={{
          position: "absolute",
          bottom: "50px", // Adjust as needed
          left: "60px", // Adjust as needed
          backgroundColor: "rgba(255, 255, 255, 0.8)", // Optional styling
          padding: "5px", // Optional styling
          borderRadius: "5px", // Optional styling
          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)", // Optional styling
        }}
      > Zoom: {Math.round(scaleRef.current * 10000) / 10000}%
      </div>
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
        {Object.entries(toolsList).map(([key, item]) => (
          <div
            key={key} // Use the key from the object
            className="toolbox-item"
            onClick={(e) => handleToolChange(e, item.toolName)}
            onMouseEnter={() => handleMouseEnterTool(item.displayName)} // Set hovered tool
            onMouseMove={handleMouseMoveTool} // Track cursor position
            onMouseLeave={handleMouseLeaveTool} // Clear hovered tool
            style={{
              backgroundColor: tool === item.toolName ? "lightblue" : "white",
            }}
          >
            <img
              src={item.icon}
              style={{
                width: "20px",
                height: "20px",
                objectFit: "contain",
              }}
            />
          </div>
        ))}
        </div>
      {hoveredTool && (
        <div
          style={{
            position: "absolute",
            top: `${tooltipPosition.y}px`,
            left: `${tooltipPosition.x}px`,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px 10px",
            borderRadius: "5px",
            fontSize: "14px",
            pointerEvents: "none", // Prevent tooltip from interfering with mouse events
            transform: "translate(-50%, 0)", // Center the tooltip horizontally
          }}
        >
          {hoveredTool.charAt(0).toUpperCase() + hoveredTool.slice(1)}           {/* Capitalize the first letter */}
        </div> 
      )}
    </div>
  );
}

export default App;

