import "./App.css";
import { useRef, useState, useEffect } from "react";

function App() {
  const canvasRef = useRef(null);
  const divRef = useRef(null);

  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const [selectionBox, setSelectionBox] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedElements, setSelectedElements] = useState([]);
  
  const [tool, setTool] = useState("select");
  const minimumScale = 0.01;
  const maximumScale = 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
  
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(scale, scale);
  
    // Draw elements
    ctx.fillStyle = "blue";
    ctx.fillRect(20, 20, 20, 20);
    ctx.beginPath();
    ctx.arc(200, 200, 50, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  
    ctx.restore();
  }, [panOffset, scale]);
  

  const handleMouseDown = (e) => {
    setLastMousePos({ x: e.clientX, y: e.clientY });
    if (tool === "hand") {
      setIsPanning(true);
    } else if (tool === "select") {
      setIsSelecting(true);
      setSelectionBox({ left: e.clientX, top: e.clientY, width: 0, height: 0 });
      setSelectedElements([]);
      selectedElements.forEach((el) => el.classList.remove("selected"));
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (isSelecting) {
      const left = Math.min(e.clientX, lastMousePos.x);
      const top = Math.min(e.clientY, lastMousePos.y);
      const width = Math.abs(e.clientX - lastMousePos.x);
      const height = Math.abs(e.clientY - lastMousePos.y);
      setSelectionBox({ left, top, width, height });
      const elements = findOverlappingElements({ left, top, width, height }, divRef.current);
      setSelectedElements(elements);
      elements.forEach((el) => el.classList.add("selected"));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox({ left: 0, top: 0, width: 0, height: 0 });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setScale((prev) => Math.max(Math.min(prev - e.deltaY * 0.01, maximumScale), minimumScale));
};

  const handleToolChange = (e, tool) => {
    e.preventDefault();
    setTool(tool);
  };

  const findOverlappingElements = (selectionBox, parentElement) => {
    if (!parentElement) return [];
    return Array.from(parentElement.children).filter((el) => {
      const rect = el.getBoundingClientRect();
      return (
        rect.right > selectionBox.left &&
        rect.left < selectionBox.left + selectionBox.width &&
        rect.bottom > selectionBox.top &&
        rect.top < selectionBox.top + selectionBox.height
      );
    });
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
      ></div>
      <div id="tools-div">
        {[
          { displayName: "Select - V", toolName: "select", icon: "👆🏼" },
          { displayName: "Hand - H", toolName: "hand", icon: "👋" },
          { displayName: "Draw - D", toolName: "draw", icon: "✏️" },
          { displayName: "Eraser - E", toolName: "eraser", icon: "🧽" },
          { displayName: "Arrow - A", toolName: "arrow", icon: "↑" },
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