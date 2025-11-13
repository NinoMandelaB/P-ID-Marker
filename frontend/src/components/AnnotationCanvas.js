import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';

export default function AnnotationCanvas({ 
  shapes = [], 
  onDrawShape, 
  onSelectShape,
  mode = 'draw',
  tool = 'rect',
  width, 
  height,
  scale = 1.0  // NEW: Accept scale prop
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState(null);
  const stageRef = useRef(null);

  const handleMouseDown = (e) => {
    if (mode !== 'draw') return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Adjust for scale - divide by scale to get actual coordinates
    const x = pointerPosition.x / scale;
    const y = pointerPosition.y / scale;
    
    setIsDrawing(true);
    setCurrentShape({
      tool,
      x: x,
      y: y,
      width: 0,
      height: 0,
      points: tool === 'freehand' ? [x, y] : []
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || mode !== 'draw') return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Adjust for scale
    const x = pointerPosition.x / scale;
    const y = pointerPosition.y / scale;

    if (tool === 'freehand') {
      setCurrentShape(prev => ({
        ...prev,
        points: [...prev.points, x, y]
      }));
    } else {
      setCurrentShape(prev => ({
        ...prev,
        width: x - prev.x,
        height: y - prev.y
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentShape) return;
    
    setIsDrawing(false);
    
    if (onDrawShape) {
      onDrawShape(currentShape);
    }
    
    setCurrentShape(null);
  };

  const handleShapeClick = (shape) => {
    if (mode === 'edit' && onSelectShape) {
      onSelectShape(shape);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={width || 800}
      height={height || 1131}
      scaleX={scale}  // NEW: Apply scale transformation
      scaleY={scale}  // NEW: Apply scale transformation
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ border: '1px solid #ddd', cursor: mode === 'draw' ? 'crosshair' : 'pointer' }}
    >
      <Layer>
        {/* Render existing shapes - coordinates are in PDF space, Stage scale handles display */}
        {shapes.map((shape, i) => {
          if (shape.overlay_type === 'rect' || shape.tool === 'rect') {
            return (
              <Rect
                key={i}
                x={shape.overlay_x || shape.x}
                y={shape.overlay_y || shape.y}
                width={shape.width || 50}
                height={shape.height || 50}
                stroke="red"
                strokeWidth={2 / scale}  // Adjust stroke width for scale
                onClick={() => handleShapeClick(shape)}
              />
            );
          } else if (shape.overlay_type === 'circle' || shape.tool === 'circle') {
            return (
              <Circle
                key={i}
                x={shape.overlay_x || shape.x}
                y={shape.overlay_y || shape.y}
                radius={shape.radius || Math.abs(shape.width) / 2 || 25}
                stroke="blue"
                strokeWidth={2 / scale}  // Adjust stroke width for scale
                onClick={() => handleShapeClick(shape)}
              />
            );
          } else if (shape.overlay_type === 'freehand' || shape.tool === 'freehand') {
            return (
              <Line
                key={i}
                points={shape.points || []}
                stroke="green"
                strokeWidth={2 / scale}  // Adjust stroke width for scale
                onClick={() => handleShapeClick(shape)}
              />
            );
          }
          return null;
        })}
        
        {/* Render shape being drawn */}
        {currentShape && currentShape.tool === 'rect' && (
          <Rect
            x={currentShape.x}
            y={currentShape.y}
            width={currentShape.width}
            height={currentShape.height}
            stroke="red"
            strokeWidth={2 / scale}
          />
        )}
        
        {currentShape && currentShape.tool === 'circle' && (
          <Circle
            x={currentShape.x}
            y={currentShape.y}
            radius={Math.abs(currentShape.width) / 2}
            stroke="blue"
            strokeWidth={2 / scale}
          />
        )}
        
        {currentShape && currentShape.tool === 'freehand' && (
          <Line
            points={currentShape.points}
            stroke="green"
            strokeWidth={2 / scale}
          />
        )}
      </Layer>
    </Stage>
  );
}
