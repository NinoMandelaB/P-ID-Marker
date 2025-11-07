import React, { useRef, useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the worker (keep this line)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfUrl, pageNum, numPages, onPageChange, onDocumentLoad }) {
  const containerRef = useRef();
  const [containerWidth, setContainerWidth] = useState(800);

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
    <div ref={containerRef} style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoad}
      >
        <Page
          pageNumber={pageNum}
          width={containerWidth ? containerWidth - 32 : 800}
        />
      </Document>
      <div>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <span> Page {pageNum} / {numPages || '?'} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
