/*import React, { useState, useEffect } from 'react';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import ElementTable from '../components/ElementTable';
import ElementDetails from '../components/ElementDetails';
import { getElementsByDoc } from '../api/api';

export default function AnnotatePage({ pdfDoc }) {
  // ❗️ All hooks must come first, always!
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  useEffect(() => {
    // Only fetch if pdfDoc exists
    if (!pdfDoc) return;
    getElementsByDoc(pdfDoc.id).then(res => setElements(res.data));
  }, [pdfDoc?.id]);

  // Still okay to render conditionally!
  if (!pdfDoc) {
    return <div>No PDF loaded</div>;
  }

  // Render PDF as image with PDFViewer, overlay shapes with AnnotationCanvas
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 2 }}>
        {/* PDF + Drawing *//*}
        <PDFViewer pdfData={pdfDoc.pdf_data} pageNum={pageNum} onPageChange={setPageNum} numPages={numPages} />
        <AnnotationCanvas shapes={elements.filter(e => e.overlay_page === pageNum)} width={800} height={1100} mode="view" />
      </div>
      <div style={{ flex: 1 }}>
        <ElementTable elements={elements} onSelect={setSelectedElement} />
        <ElementDetails
          element={selectedElement}
          attachments={selectedElement?.attachments ?? []}
          comments={selectedElement?.comments ?? []}
        />
      </div>
    </div>
  );
}*/

export default function AnnotationPage() {
  return <div>Annotation Page placeholder</div>;
}

