// AnnotatePage.js
import React, { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import ElementTable from '../components/ElementTable';
import ElementDetails from '../components/ElementDetails';

export default function AnnotatePage({ pdfDoc, goBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  // Build the PDF URL from the document ID
  const pdfUrl = `https://p-id-marker-production.up.railway.app/api/pid_documents/${pdfDoc.id}/pdf`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc.filename}</h2>
      <PDFViewer
        pdfUrl={pdfUrl}  // Changed: pass URL instead of pdfData
        pageNum={pageNum}
        numPages={numPages}
        onPageChange={setPageNum}
        onDocumentLoad={({ numPages }) => setNumPages(numPages)}
      />
      <AnnotationCanvas
        shapes={elements.filter(e => e.overlay_page === pageNum)}
        onSelect={setSelectedElement}
        selected={selectedElement}
      />
      <ElementTable elements={elements} onSelect={setSelectedElement} />
      <ElementDetails 
        element={selectedElement} 
        attachments={selectedElement?.attachments || []} 
        comments={selectedElement?.comments || []} 
      />
    </div>
  );
}
