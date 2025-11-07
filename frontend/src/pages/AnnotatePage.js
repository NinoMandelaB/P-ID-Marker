// AnnotatePage.js
import React, { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import ElementTable from '../components/ElementTable';
import ElementDetails from '../components/ElementDetails';

// Assume pdfDoc is an object: {id, filename, ...}
export default function AnnotatePage({ pdfDoc, goBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [elements, setElements] = useState([]); // Your annotation rectangles/zones
  const [selectedElement, setSelectedElement] = useState(null);
  const [canvasWidth, setCanvasWidth] = useState(800);

  // Construct PDF URL from doc id -- adjust the base as needed for your backend
  const pdfUrl = pdfDoc && pdfDoc.id
    ? `https://p-id-marker-production.up.railway.app/api/pid_documents/${pdfDoc.id}/pdf`
    : null;

  // Handler: when drawing new shape in AnnotationCanvas
  const handleDrawShape = (shape) => {
    // You may enrich with more element metadata as needed
    const newElement = {
      ...shape,
      overlay_page: pageNum,
      element_type: 'annotation', // default
      id: Date.now(),
      serial_number: elements.length + 1,
      position: '',
      internal_number: ''
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc?.filename}</h2>
      <div style={{ position: "relative" }}>
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNum={pageNum}
          numPages={numPages}
          onPageChange={setPageNum}
          onDocumentLoad={({ numPages }) => setNumPages(numPages)}
          setContainerWidth={setCanvasWidth} // Pass width setter!
        />
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none"
        }}>
          <AnnotationCanvas
            shapes={elements.filter(e => e.overlay_page === pageNum)}
            onDrawShape={handleDrawShape}
            mode="edit"
            width={canvasWidth}
            height={Math.floor(canvasWidth * 1.414)}
            selected={selectedElement}
            onSelect={setSelectedElement}
          />
        </div>
      </div>
      <ElementTable
        elements={elements}
        onSelect={setSelectedElement}
      />
      <ElementDetails
        element={selectedElement}
        attachments={selectedElement?.attachments || []}
        comments={selectedElement?.comments || []}
      />
    </div>
  );
}
