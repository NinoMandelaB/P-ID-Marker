// PDFViewer.js
import React, { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the worker (keep this line)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfUrl, pageNum, numPages, onPageChange, onDocumentLoad }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(null);

  // Measure container width and update on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoad}
      >
        <Page 
          pageNumber={pageNum} 
          width={containerWidth || undefined}  // Fit to container width
        />
      </Document>
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <span style={{ margin: '0 15px' }}> Page {pageNum} / {numPages || '?'} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
