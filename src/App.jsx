import "./App.css";
import { useRef, useState, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const divRef = useRef(null);

  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const translationRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElements, setSelectedElements] = useState([]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const pathsRef = useRef([]);

  const [isDrawingArrow, setIsDrawingArrow] = useState(false);
  const [startPoint, setStartPoint] = useState(null);

  const [isErasing, setIsErasing] = useState(false);
  const [hoveredElements, setHoveredElements] = useState([]);

  const [tool, setTool] = useState("select");

  const textBoxesRef = useRef([]);
  const [isDrawingTextBox, setIsDrawingTextBox] = useState(false);
  const [startTextBox, setStartTextBox] = useState(null);
  const [activeInput, setActiveInput] = useState(null);

  const [eraserBox, setEraserBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const imagesRef = useRef([]);
  const notesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext("2d");

    // Setup initial canvas state
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";

    ctxRef.current = ctx;
  }, []);

  const findOverlappingPaths = (selectionBox) => {
    const selectedPaths = [];
  
    // Check paths (lines, arrows, etc.)
    pathsRef.current.forEach((path) => {
      if (path.type === 'arrow') {
        const left = Math.min(path.startX, path.endX);
        const right = Math.max(path.startX, path.endX);
        const top = Math.min(path.startY, path.endY);
        const bottom = Math.max(path.startY, path.endY);
  
        if (
          left < selectionBox.left + selectionBox.width &&
          right > selectionBox.left &&
          top < selectionBox.top + selectionBox.height &&
          bottom > selectionBox.top
        ) {
          selectedPaths.push(path);
        }
      } else {
        const isOverlapping = path.some(({ x, y }) => {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
  
          const screenX = x * scaleRef.current + translationRef.current.x + rect.left;
          const screenY = y * scaleRef.current + translationRef.current.y + rect.top;
  
          return (
            screenX >= selectionBox.left &&
            screenX <= selectionBox.left + selectionBox.width &&
            screenY >= selectionBox.top &&
            screenY <= selectionBox.top + selectionBox.height
          );
        });
  
        if (isOverlapping) {
          selectedPaths.push(path);
        }
      }
    });
  
    // ✅ Include textboxes in selection
    textBoxesRef.current.forEach((box) => {
      const left = box.x;
      const right = box.x + box.width;
      const top = box.y;
      const bottom = box.y + box.height;
  
      if (
        left < selectionBox.left + selectionBox.width &&
        right > selectionBox.left &&
        top < selectionBox.top + selectionBox.height &&
        bottom > selectionBox.top
      ) {
        selectedPaths.push(box);
      }
    });

  const selectedImages = imagesRef.current.filter(image =>
      selectionBox.top >= image.x && selectionBox.top <= image.x + image.width &&
      selectionBox.left >= image.y && selectionBox.left <= image.y + image.height
  );  

  const selectedNotes = notesRef.current.filter(note =>
    selectionBox.top >= note.x && selectionBox.top <= note.x + note.width &&
    selectionBox.left >= note.y && selectionBox.left <= note.y + note.height
  );

  console.log(
    selectionBox.top >= notesRef.current[0].x, 
    selectionBox.top <= notesRef.current[0].x + notesRef.current[0].width, 
    selectionBox.left >= notesRef.current[0].y, 
    selectionBox.left <= notesRef.current[0].y + notesRef.current[0].height)

  
  return [
    ...selectedPaths,
    ...selectedImages,
    ...selectedNotes,
    ];
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
    const x = (e.clientX - rect.left - translationRef.current.x) / scaleRef.current;
    const y = (e.clientY - rect.top - translationRef.current.y) / scaleRef.current;
    return { offsetX: x, offsetY: y };
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
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
      
      if (hoveredElements.includes(box)) {
        ctx.globalAlpha = 0.3; // Transparent when erasing
      } else {
        ctx.globalAlpha = 1.0;
      }
  
      if (selectedElements.includes(box)) {
        ctx.strokeStyle = "blue"; // Blue when selected
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;
      }
  
      ctx.stroke();
  
      ctx.font = "16px Arial";
      ctx.fillStyle = "black";
      ctx.fillText(box.text, box.x + 4, box.y + 20);
    });
  
    // ✅ Draw paths
    pathsRef.current.forEach((path) => {
      if (path.type === "arrow") {
        ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
        drawArrow(
          path.startX,
          path.startY,
          path.endX,
          path.endY,
          selectedElements.includes(path)
        );
      } else {
        ctx.beginPath();
        path.forEach(({ x, y }, index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
  
        ctx.globalAlpha = hoveredElements.includes(path) ? 0.3 : 1.0;
        if (selectedElements.includes(path)) {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = "black";
          ctx.lineWidth = 2;
        }
  
        ctx.stroke();
      }
    });
  
    ctx.globalAlpha = 1.0;

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
      console.log("blue selected")
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

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = getMousePos(e);
    setLastMousePos({ x: e.clientX, y: e.clientY });

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

    if (tool === "hand") {
      setIsPanning(true);
    } else if (tool === "select") {
      setIsSelecting(true);
      setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
      setSelectedElements([]);
      redrawCanvas();
    } else if (tool === "draw") {
      setIsDrawing(true);

      // Start a new path
      pathsRef.current.push([{ x: offsetX, y: offsetY }]);
    } else if (tool === "arrow") {
      setIsDrawingArrow(true);
      setStartPoint({ x: offsetX, y: offsetY });
    } else if (tool === "eraser") {
      setEraserBox({ left: e.clientX, top: e.clientY, width: 20, height: 20 });
      setIsErasing(true);
    } else if (tool === "text") {
      setIsDrawingTextBox(true);
      setStartTextBox({ x: offsetX, y: offsetY});
    } else if (tool === "note") {
      handleCreateNote(offsetX, offsetY)
      handleToolChange(e, "select")
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
  
      translationRef.current.x += dx;
      translationRef.current.y += dy;
  
      setLastMousePos({
        x: e.clientX,
        y: e.clientY,
      });
  
      redrawCanvas()
    } else if (isSelecting) {
        const left = Math.min(e.clientX, lastMousePos.x);
        const top = Math.min(e.clientY, lastMousePos.y);
        const width = Math.abs(e.clientX - lastMousePos.x);
        const height = Math.abs(e.clientY - lastMousePos.y);
      
        setSelectionBox({ left, top, width, height });
      
        const selectedElements = findOverlappingPaths({ left, top, width, height });
        setSelectedElements(selectedElements);
      
        redrawCanvas();
      
    } else if (isDrawing) {
      const { offsetX, offsetY } = getMousePos(e);

      // Add point to current path
      const currentPath = pathsRef.current[pathsRef.current.length - 1];
      currentPath.push({ x: offsetX, y: offsetY });
  
      // Draw line to latest point
      redrawCanvas(); // Redraw everything with new path

    } else if (isDrawingArrow) {
      const { offsetX, offsetY } = getMousePos(e);

      redrawCanvas();
      drawArrow(startPoint.x, startPoint.y, offsetX, offsetY, false);
    } else if (isErasing) {
      const width = 20;
      const height = 20;
      const left = e.clientX - width / 2;
      const top = e.clientY - height / 2;
    
      setEraserBox({ left, top, width, height });
    
      // ✅ Find paths and textboxes under the eraser
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
    } else if (isDrawingTextBox) {
      const { offsetX, offsetY } = getMousePos(e);
      const width = offsetX - startTextBox.x;
      const height = 30;

      redrawCanvas();

      // Draw a preview of the textbox
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.rect(startTextBox.x, startTextBox.y, width, height);
      ctx.strokeStyle = "gray";
      ctx.stroke();
    }
  }

  const handleMouseUp = (e) => {
    setIsPanning(false);
    setIsSelecting(false);
    setIsDrawing(false);
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });
    if (isDrawingArrow) {
      const { offsetX, offsetY } = getMousePos(e);
  
      // Save the completed arrow to pathsRef
      pathsRef.current.push({
        type: "arrow",
        startX: startPoint.x,
        startY: startPoint.y,
        endX: offsetX,
        endY: offsetY,
      });
  
      setIsDrawingArrow(false); // ✅ Properly reset state
      setStartPoint(null);
  
      redrawCanvas(); // ✅ Finalize the arrow on canvas
    } else if (isErasing) {
      // Remove hovered elements from paths
      removePaths(hoveredElements);
      setHoveredElements([]);
      setIsErasing(false);
      setEraserBox({ left: 0, top: 0, width: 0, height: 0 });
  
      redrawCanvas(); // Finalize the canvas state after erasure
    } else if (isDrawingTextBox) {
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

      setIsDrawingTextBox(false);
      setStartTextBox(null);

      redrawCanvas();

    }
  };

  const handleWheel = (e) => {
    // e.preventDefault();

    const scaleAmount = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = scaleRef.current * scaleAmount;

    const canvas = canvasRef.current;
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    // Adjust translation so zooming focuses on mouse position
    translationRef.current.x -= mouseX / scaleRef.current - mouseX / newScale;
    translationRef.current.y -= mouseY / scaleRef.current - mouseY / newScale;
 
    scaleRef.current = newScale;

    redrawCanvas();
  };

  const handleToolChange = (e, tool) => {
    e.preventDefault();
    if (tool == "asset") {
      handleAssetTool();
    }
    setTool(tool);
  };

  const handleInputChange = (e) => {
    setActiveInput((prev) => ({
      ...prev,
      text: e.target.value,
    }));
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
          cursor: isPanning ? "grabbing" : "default"
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
            left: `${activeInput.x * scaleRef.current + translationRef.current.x + canvasRef.current.getBoundingClientRect().left}px`,
            top: `${activeInput.y * scaleRef.current + translationRef.current.y + canvasRef.current.getBoundingClientRect().top}px`,
            width: `${activeInput.width * scaleRef.current}px`,
            height: `${activeInput.height * scaleRef.current}px`,
            fontSize: "16px",
            padding: "4px",
            border: "1px solid black",
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
      <div ref={divRef} id="whiteboard-div">
        <div className="whiteboard-element">Sample Element</div>
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
        {[
          { displayName: "Select - V", toolName: "select", icon: "👆🏼" }, // done
          { displayName: "Hand - H", toolName: "hand", icon: "👋" }, // done
          { displayName: "Draw - D", toolName: "draw", icon: "✏️" }, // done
          { displayName: "Eraser - E", toolName: "eraser", icon: "🧽" },
          { displayName: "Arrow - A", toolName: "arrow", icon: "↑" }, // done
          { displayName: "Text - T", toolName: "text", icon: "T" },
          { displayName: "Note - N", toolName: "note", icon: "📑" },
          { displayName: "Asset - U", toolName: "asset", icon: "🌠" },
          { displayName: "Rectangle - R", toolName: "rectangle", icon: "⬜️" },
        ].map((item) => (
          <div key={item.toolName} className="toolbox-item" onClick={(e) => handleToolChange(e, item.toolName)}>
            {item.icon}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;