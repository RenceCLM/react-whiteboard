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


  const [testBox, setTestBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

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
  
    pathsRef.current.forEach((path) => {
      if (path.type === "arrow") {
        // Check bounding box of arrow line
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
        // Handle other shapes
        const isOverlapping = path.some(({ x, y }) => {

          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
  
          const screenX =
            x * scaleRef.current + translationRef.current.x + rect.left;
          const screenY =
            y * scaleRef.current + translationRef.current.y + rect.top;
  
          return (
            screenX >= selectionBox.left &&
            screenX <= selectionBox.left + selectionBox.width &&
            screenY >= selectionBox.top &&
            screenY <= selectionBox.top + selectionBox.height
          );
        });

        console.log("is it overlaping?: ", isOverlapping)
        if (isOverlapping) {
          
          selectedPaths.push(path);
        }
      }
    });
  
    return selectedPaths;
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

  const setOpacityForPaths = (paths, opacity) => {
    const ctx = ctxRef.current;
  
    paths.forEach((path) => {
      ctx.globalAlpha = opacity;
      if (path.type === "arrow") {
        drawArrow(path.startX, path.startY, path.endX, path.endY, false);
      } else {
        ctx.beginPath();
        path.forEach(({ x, y }, index) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }
    });
  
    // Reset global alpha to avoid affecting other drawings
    ctx.globalAlpha = 1.0;
  };

  const removePaths = (paths) => {
    pathsRef.current = pathsRef.current.filter(
      (path) => !paths.includes(path)
    );
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
  
    pathsRef.current.forEach((path) => {
      if (path.type === "arrow") {
        // If it's hovered, reduce opacity
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
  
        // Change opacity if hovered
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
  
    // ✅ Reset global alpha to avoid affecting other drawings
    ctx.globalAlpha = 1.0;
  };
  
  

 /* 
 
  __  __  ____  _    _  _____ ______   ________      ________ _   _ _______ _____ 
 |  \/  |/ __ \| |  | |/ ____|  ____| |  ____\ \    / /  ____| \ | |__   __/ ____|
 | \  / | |  | | |  | | (___ | |__    | |__   \ \  / /| |__  |  \| |  | | | (___  
 | |\/| | |  | | |  | |\___ \|  __|   |  __|   \ \/ / |  __| | . ` |  | |  \___ \ 
 | |  | | |__| | |__| |____) | |____  | |____   \  /  | |____| |\  |  | |  ____) |
 |_|  |_|\____/ \____/|_____/|______| |______|   \/   |______|_| \_|  |_| |_____/ 
                                                                                   
 
 */



  const handleMouseDown = (e) => {
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (tool === "hand") {
      setIsPanning(true);
    } else if (tool === "select") {
      setIsSelecting(true);
      setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
      setSelectedElements([]);
      redrawCanvas();
    } else if (tool === "draw") {
      const { offsetX, offsetY } = getMousePos(e);
      setIsDrawing(true);
  
      // Start a new path
      pathsRef.current.push([{ x: offsetX, y: offsetY }]);
    } else if (tool === "arrow") {
      const { offsetX, offsetY } = getMousePos(e);
      setIsDrawingArrow(true);
      setStartPoint({ x: offsetX, y: offsetY });
    } else if (tool === "eraser") {
      setIsErasing(true);
    }
}

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

      const selectedPaths = findOverlappingPaths({ left, top, width, height });

      setSelectedElements(selectedPaths);

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
    
        setTestBox({ left, top, width, height });
    
        // Find paths under the eraser
        const overlappingPaths = findOverlappingPaths({
          left,
          top,
          width,
          height,
        });
    
        setHoveredElements((prevHoveredElements) => [
          ...new Set([...prevHoveredElements, ...overlappingPaths]),
        ]);        
        console.log(hoveredElements)
    
        // ✅ Redraw canvas with updated opacity
        redrawCanvas();
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
  
      redrawCanvas(); // Finalize the canvas state after erasure
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
    setTool(tool);
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
        id="test-box"
        style={{
          position: "absolute",
          border: "1px dashed red",
          backgroundColor: "rgba(255, 0, 0, 0.1)",
          borderRadius: "50%",
          top: `${testBox.top}px`,
          left: `${testBox.left}px`,
          width: `${testBox.width}px`,
          height: `${testBox.height}px`,
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