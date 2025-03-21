import "./App.css";
import { useRef, useState, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const divRef = useRef(null);

  const [tool, setTool] = useState("select");
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  const [selectedElements, setSelectedElements] = useState([]);
  const pathsRef = useRef([]);
  const translationRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);

  const minimumScale = 0.01;
  const maximumScale = 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    const ctx = canvas.getContext("2d");

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";

    ctxRef.current = ctx;
  }, []);

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
      scaleRef.current, 0, 0, scaleRef.current,
      translationRef.current.x, translationRef.current.y
    );

    // 🔥 Redraw all stored paths
    pathsRef.current.forEach((path) => {
      ctx.beginPath();
      path.forEach(({ x, y }, i) => {
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      if (selectedElements.includes(path)) {
        ctx.strokeStyle = "blue"; // Highlight selected paths
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
      }

      ctx.stroke();
    });
  };

  const findOverlappingPaths = (selectionBox) => {
    const selectedPaths = [];

    pathsRef.current.forEach((path) => {
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
    });

    return selectedPaths;
  };

  const handleMouseDown = (e) => {
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (tool === "hand") {
      setIsPanning(true);
    } else if (tool === "select") {
      setIsSelecting(true);
      setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
      setSelectedElements([]);
    } else if (tool === "draw") {
      const { offsetX, offsetY } = getMousePos(e);
      setIsDrawing(true);
      pathsRef.current.push([{ x: offsetX, y: offsetY }]);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      translationRef.current.x += dx;
      translationRef.current.y += dy;

      setLastMousePos({ x: e.clientX, y: e.clientY });
      redrawCanvas();
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

      const currentPath = pathsRef.current[pathsRef.current.length - 1];
      currentPath.push({ x: offsetX, y: offsetY });

      redrawCanvas();
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsSelecting(false);
    setIsDrawing(false);
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });
  };

  const handleWheel = (e) => {
    const scaleAmount = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.min(Math.max(scaleRef.current * scaleAmount, minimumScale), maximumScale);

    const canvas = canvasRef.current;
    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    translationRef.current.x -= mouseX / scaleRef.current - mouseX / newScale;
    translationRef.current.y -= mouseY / scaleRef.current - mouseY / newScale;

    scaleRef.current = newScale;
    redrawCanvas();
  };

  const handleToolChange = (tool) => setTool(tool);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ cursor: isPanning ? "grabbing" : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Selection Box */}
      {isSelecting && (
        <div
          style={{
            position: "absolute",
            border: "1px dashed blue",
            backgroundColor: "rgba(0, 0, 255, 0.1)",
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tools */}
      <div>
        {["select", "hand", "draw"].map((toolName) => (
          <button key={toolName} onClick={() => handleToolChange(toolName)}>
            {toolName}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
