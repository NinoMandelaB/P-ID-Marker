// AnnotatePage.js
import React, { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import ElementTable from '../components/ElementTable';
import ElementDetails from '../components/ElementDetails';

export default function AnnotatePage({ pdfDoc, goBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [elements, setElements] = useState([]); // Load actual elements later
  const [selectedElement, setSelectedElement] = useState(null);

  // Convert pdf_data as needed (example for base64 string backend)
  let pdfData = null;
  if (pdfDoc?.pdf_data) {
    try {
      pdfData = Uint8Array.from(atob(pdfDoc.pdf_data), c => c.charCodeAt(0));
    } catch {
      pdfData = null;
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc.filename}</h2>
      {pdfData ? (
        <PDFViewer
          pdfData={pdfData}
          pageNum={pageNum}
          numPages={numPages}
          onPageChange={setPageNum}
          onDocumentLoad={({ numPages }) => setNumPages(numPages)}
        />
      ) : (
        <div style={{ color: "red" }}>No PDF data available for preview.</div>
      )}
      <AnnotationCanvas
        shapes={elements.filter(e => e.overlay_page === pageNum)}
        onSelect={setSelectedElement}
        selected={selectedElement}
      />
      <ElementTable elements={elements} onSelect={setSelectedElement} />
      <ElementDetails element={selectedElement} attachments={selectedElement?.attachments || []} comments={selectedElement?.comments || []} />
    </div>
  );
}
