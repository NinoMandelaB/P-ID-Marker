import React from 'react';
import { Stage, Layer, Rect, Circle, Ellipse, Line } from 'react-konva';

export default function AnnotationCanvas({ shapes, onDrawShape, mode, ...props }) {
  // shapes: [{type, x, y, width, height, color, strokeWidth, ...}]
  // mode: "view" | "edit"
  return (
    <Stage width={props.width} height={props.height}>
      <Layer>
        {shapes.map((shape, idx) => {
          switch (shape.type) {
            case 'rect':
              return <Rect key={idx} {...shape} />;
            case 'circle':
              return <Circle key={idx} {...shape} />;
            case 'ellipse':
              return <Ellipse key={idx} {...shape} />;
            case 'line':
              return <Line key={idx} {...shape} />;
            default:
              return null;
          }
        })}
        {/* Add handlers for drawing new shapes in edit mode here */}
      </Layer>
    </Stage>
  );
}
