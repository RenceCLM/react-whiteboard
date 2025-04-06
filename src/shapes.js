export const drawRectangle = (ctx, path) => {
  ctx.strokeRect(
    Math.min(path.x, path.x + path.width),
    Math.min(path.y, path.y + path.height),
    Math.abs(path.width),
    Math.abs(path.height)
  );
};

export const drawCircle = (ctx, path) => {
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
};

export const drawTriangle = (ctx, path) => {
  ctx.beginPath();
  ctx.moveTo(path.x + path.width / 2, path.y);
  ctx.lineTo(path.x, path.y + Math.abs(path.height));
  ctx.lineTo(path.x + Math.abs(path.width), path.y + Math.abs(path.height));
  ctx.closePath();
  ctx.stroke();
};

export const drawDiamond = (ctx, path) => {
  ctx.beginPath();
  ctx.moveTo(path.x + path.width / 2, path.y);
  ctx.lineTo(path.x + Math.abs(path.width), path.y + path.height / 2);
  ctx.lineTo(path.x + path.width / 2, path.y + Math.abs(path.height));
  ctx.lineTo(path.x, path.y + path.height / 2);
  ctx.closePath();
  ctx.stroke();
};

export const drawHexagon = (ctx, path) => {
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
};

export const drawOval = (ctx, path) => {
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
};

export const drawTrapezoid = (ctx, path) => {
  const topWidth = Math.abs(path.width) * 0.6; // Top edge is 60% of the bottom edge
  const bottomWidth = Math.abs(path.width);
  const height = Math.abs(path.height);

  const topX = path.x + (bottomWidth - topWidth) / 2; // Center the top edge
  const bottomX = path.x;

  ctx.beginPath();
  ctx.moveTo(topX, path.y); // Top-left
  ctx.lineTo(topX + topWidth, path.y); // Top-right
  ctx.lineTo(bottomX + bottomWidth, path.y + height); // Bottom-right
  ctx.lineTo(bottomX, path.y + height); // Bottom-left
  ctx.closePath();
  ctx.stroke();
};

export const drawStar = (ctx, path) => {
  const centerX = path.x + Math.abs(path.width) / 2;
  const centerY = path.y + Math.abs(path.height) / 2;
  const outerRadius = Math.min(Math.abs(path.width), Math.abs(path.height)) / 2;
  const innerRadius = outerRadius / 2;
  const points = 5;

  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
};

export const drawCloud = (ctx, path) => {
  const centerX = path.x + Math.abs(path.width) / 2;
  const centerY = path.y + Math.abs(path.height) / 2;
  const radius = Math.min(Math.abs(path.width), Math.abs(path.height)) / 4;

  ctx.beginPath();
  ctx.arc(centerX - radius, centerY, radius, 0, 2 * Math.PI); // Left circle
  ctx.arc(centerX + radius, centerY, radius, 0, 2 * Math.PI); // Right circle
  ctx.arc(centerX, centerY - radius, radius, 0, 2 * Math.PI); // Top circle
  ctx.arc(centerX, centerY + radius, radius, 0, 2 * Math.PI); // Bottom circle
  ctx.closePath();
  ctx.stroke();
};

export const drawHeart = (ctx, path) => {
  const centerX = path.x + Math.abs(path.width) / 2;
  const centerY = path.y + Math.abs(path.height) / 2;
  const width = Math.abs(path.width) / 2;
  const height = Math.abs(path.height) / 2;

  ctx.beginPath();
  ctx.moveTo(centerX, centerY + height / 2); // Bottom point
  ctx.bezierCurveTo(
    centerX - width, centerY - height / 2, // Left control point
    centerX - width, centerY + height / 2, // Left top curve
    centerX, centerY - height // Top center
  );
  ctx.bezierCurveTo(
    centerX + width, centerY + height / 2, // Right control point
    centerX + width, centerY - height / 2, // Right top curve
    centerX, centerY + height / 2 // Bottom point
  );
  ctx.closePath();
  ctx.stroke();
};



export const drawLine = (ctx, path) => {
  ctx.beginPath();
  ctx.moveTo(path.startX, path.startY);
  ctx.lineTo(path.endX, path.endY);
  ctx.stroke();
};

export const drawArrow = (ctx, path) => {
  // Calculate the angle of the arrow
  const angle = Math.atan2(path.endY - path.startY, path.endX - path.startX);
  

  // Arrowhead dimensions
  const arrowLength = 20; // Length of the arrowhead
  const arrowWidth = 10;  // Width of the arrowhead

  // Shorten the main line to stop at the base of the arrowhead
  const TEMPORARY_TWO = 2; // TEMPORARY BECAUSE IT SHORTENS THE LINE TOO MUCH AND THE 2 INCREASES THE LINE
  const lineEndX = (path.endX - arrowLength / TEMPORARY_TWO * Math.cos(angle))
  const lineEndY = (path.endY - arrowLength / TEMPORARY_TWO * Math.sin(angle))

  // Draw the main line of the arrow
  ctx.beginPath();
  ctx.moveTo(path.startX, path.startY);
  ctx.lineTo(lineEndX, lineEndY);
  ctx.stroke();

  // Calculate the points for the arrowhead
  const arrowPoint1 = {
    x: path.endX - arrowLength * Math.cos(angle - Math.atan(arrowWidth / arrowLength)),
    y: path.endY - arrowLength * Math.sin(angle - Math.atan(arrowWidth / arrowLength)),
  };

  const arrowPoint2 = {
    x: path.endX - arrowLength * Math.cos(angle + Math.atan(arrowWidth / arrowLength)),
    y: path.endY - arrowLength * Math.sin(angle + Math.atan(arrowWidth / arrowLength)),
  };

  // Draw the arrowhead
  ctx.beginPath();
  ctx.moveTo(path.endX, path.endY); // Tip of the arrow
  ctx.lineTo(arrowPoint1.x, arrowPoint1.y); // First side of the arrowhead
  ctx.lineTo(arrowPoint2.x, arrowPoint2.y); // Second side of the arrowhead
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle; // Match the arrowhead color to the line color
  ctx.fill();
};

export const drawHighlight = (ctx, path) => {
  ctx.beginPath();
  path.points.forEach(({ x, y }, index) => {
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "yellow"
  ctx.globalAlpha = 0.3

  ctx.lineWidth = 20;
  ctx.stroke();
};

export const drawLaser = (ctx, path) => {
  const now = Date.now();
  path.points = path.points.filter((point) => now - point.time <= 3000);

  ctx.beginPath();
  path.points.forEach(({ x, y }, index) => {
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });

  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();
};

export const drawCustomShape = (ctx, path) => {
  ctx.beginPath();
  path.points.forEach(({ x, y }, index) => {
    index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
};

// Mapping of shape types to their respective draw functions
export const shapeDrawers = {
  rectangle: drawRectangle,
  circle: drawCircle,
  triangle: drawTriangle,
  diamond: drawDiamond,
  hexagon: drawHexagon,
  oval: drawOval,
  trapezoid: drawTrapezoid, // Added trapezoid
  star: drawStar,           // Added star
  cloud: drawCloud,         // Added cloud
  heart: drawHeart,         // Added heart
  line: drawLine,
  arrow: drawArrow,
  highlight: drawHighlight,
  laser: drawLaser,
  draw: drawCustomShape,
};