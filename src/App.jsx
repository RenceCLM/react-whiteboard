import "./App.css";
import { useRef, useState } from "react";

function App() {
  const whiteboardRef = useRef(null);
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  const [selectionBox, setSelectionBox] = useState({left: 100, top: 100, width: 100, height: 100});
  const isSelecting = useRef(false);
  const [selectedElements, setSelectedElements] = useState([]);

  const [tool, setTool] = useState("select");

  const minimumScale = 0.01;
  const maximumScale = 3;

  const toolsArr = [
    { displayName: "Select - V", toolName: "select", icon: "👆🏼" },
    { displayName: "Hand - H", toolName: "hand", icon: "👋" },
    { displayName: "Draw - D", toolName: "draw", icon: "✏️" },
    { displayName: "Eraser - E", toolName: "eraser", icon: "🧽" },
    { displayName: "Arrow - A", toolName: "arrow", icon: "↑" },
    { displayName: "Text - T", toolName: "text", icon: "T" },
    { displayName: "Note - N", toolName: "note", icon: "📑" },
    { displayName: "Asset - U", toolName: "asset", icon: "🌠" },
    { displayName: "Rectangle - R", toolName: "rectangle", icon: "⬜️" }
  ];
  
  const handleMouseDown = (e) => {
    lastPosition.current = { x: e.clientX, y: e.clientY };

    if (tool === "hand") { isDragging.current = true; } 
    else if (tool === "select") { isSelecting.current = true; 
      setSelectionBox({left: e.clientX, top: e.clientY, width: 0, height: 0}); }
      setSelectedElements([]);
      selectedElements.forEach((el) => {
        el.classList.remove("selected");
      }
    );
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      setTransform((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    } else if (isSelecting.current) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      const width = Math.abs(clientX - lastPosition.current.x);
      const height = Math.abs(clientY - lastPosition.current.y);
      const left = Math.min(clientX, lastPosition.current.x);
      const top = Math.min(clientY, lastPosition.current.y);
      setSelectionBox({ left, top, width, height });

      const selectedElements = findOverlappingElements(selectionBox, whiteboardRef.current);
      selectedElements.forEach((el) => {
        setSelectedElements((prev) => [...prev, el]);
        el.classList.add("selected");
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging.current) {isDragging.current = false}
    else if (isSelecting.current) {isSelecting.current = false;
      setSelectionBox({left: 0, top: 0, width: 0, height: 0});
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    console.log(e.deltaY)
    const scaleAmount = e.deltaY * -0.01;
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale + scaleAmount, minimumScale), maximumScale);
      return { ...prev, scale: newScale };
    });
  };

  const handleToolChange = (e, tool) => {
    e.preventDefault();
    setTool(tool);
    console.log(tool)
  }

  const findOverlappingElements = (selectionBox, parentElement=whiteboardRef.current, filterFn = () => true) => {
    const selected = []
    const children = Array.from(parentElement.children);

    children.forEach((el) => {
      if (!filterFn(el)) return;

      const rect = el.getBoundingClientRect();

      if (
        rect.right > selectionBox.left &&
        rect.left < selectionBox.left + selectionBox.width &&
        rect.bottom > selectionBox.top &&
        rect.top < selectionBox.top + selectionBox.height
      ) {
        selected.push(el);
      }
    })
    return selected;
  }

  return (
    <div
      id="main-div"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel} // onWheel for now because there is no onPinch event
    >
      <canvas
        ref={whiteboardRef}
        className="whiteboard-div"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <div className="whiteboard-element">Sample Element</div>
      </canvas>
      <div 
      id="selection-box" 
      style={{
        top: `${selectionBox.top}px`,
        left: `${selectionBox.left}px`,
        width: `${selectionBox.width}px`,
        height: `${selectionBox.height}px`,
        }}> 
      </div>
      <div id="tools-div">
        {toolsArr.map((item) => (
          <div 
            key={item.name} 
            className="toolbox-item" 
            onClick={(e)=>{handleToolChange(e, item.toolName)}}
          >
              {item.icon}
          </div>
          ))}  
      </div>
    </div>


  );
}

export default App;
