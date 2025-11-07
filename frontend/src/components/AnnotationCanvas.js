import React, { useState } from 'react';
import { Stage, Layer, Rect } from 'react-konva';

export default function AnnotationCanvas({ shapes, onDrawShape, mode = "edit", width = 800, height = 1000 }) {
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [newRect, setNewRect] = useState(null);

  const handleMouseDown = (e) => {
    if (mode !== "edit") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    setStartPoint(point);
    setNewRect({ x: point.x, y: point.y, width: 0, height: 0, type: "rect" });
    setDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!drawing || mode !== "edit") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!startPoint) return;
    setNewRect({
      ...newRect,
      width: point.x - startPoint.x,
      height: point.y - startPoint.y,
    });
  };

  const handleMouseUp = (e) => {
    if (!drawing || mode !== "edit") return;
    setDrawing(false);
    setStartPoint(null);
    if (onDrawShape && newRect && Math.abs(newRect.width) > 10 && Math.abs(newRect.height) > 10) {
      // Only save if reasonably sized!
      onDrawShape(newRect);
    }
    setNewRect(null);
  };

  return (
    <Stage
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ border: '1px solid #ccc', marginBottom: 16 }}
    >
      <Layer>
        {shapes.map((shape, idx) => (
          <Rect
            key={idx}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke="red"
            strokeWidth={2}
            fill="rgba(255,0,0,0.1)"
          />
        ))}
        {newRect && (
          <Rect
            x={newRect.x}
            y={newRect.y}
            width={newRect.width}
            height={newRect.height}
            stroke="blue"
            strokeWidth={2}
            fill="rgba(0,0,255,0.1)"
            dash={[4, 4]}
          />
        )}
      </Layer>
    </Stage>
  );
}
