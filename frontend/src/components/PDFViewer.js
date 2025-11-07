import React, { useRef, useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';

export default function PDFViewer({ pdfData, pageNum, numPages, onPageChange, onDocumentLoad }) {
  const containerRef = useRef();
  const [containerWidth, setContainerWidth] = useState(800);

  // Update width on window resize
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
        file={{ data: pdfData }}
        onLoadSuccess={onDocumentLoad}
      >
        <Page pageNumber={pageNum} width={containerWidth ? containerWidth - 32 : 800} />
      </Document>
      <div style={{ margin: '0.5em 0' }}>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <span> Page {pageNum} / {numPages || '?'} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
