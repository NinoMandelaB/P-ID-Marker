import React, { useRef, useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@mui/material';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfUrl, pageNum, numPages, onPageChange, onDocumentLoad, setContainerWidth, scale, setScale, onPageRender }) {
  const containerRef = useRef(null);
  const pageContainerRef = useRef(null);
  const [containerWidthState, setContainerWidthState] = useState(null);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidthState(width);
        if (setContainerWidth) {
          setContainerWidth(width);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [setContainerWidth]);

  // Notify parent when page renders to get positioning
  useEffect(() => {
    if (pageContainerRef.current && onPageRender) {
      const rect = pageContainerRef.current.getBoundingClientRect();
      onPageRender(rect);
    }
  }, [scale, containerWidthState, onPageRender]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {/* Zoom Controls */}
      <div style={{ marginBottom: '10px', textAlign: 'center', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
        <Button onClick={handleZoomOut} variant="outlined" size="small" style={{ marginRight: '8px' }}>
          Zoom Out
        </Button>
        <span style={{ margin: '0 10px', fontWeight: 'bold' }}>{Math.round(scale * 100)}%</span>
        <Button onClick={handleZoomIn} variant="outlined" size="small" style={{ marginRight: '8px' }}>
          Zoom In
        </Button>
        <Button onClick={handleResetZoom} variant="outlined" size="small">
          Reset
        </Button>
      </div>

      {/* PDF Document Container */}
      <div ref={pageContainerRef} style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoad}
        >
          <Page 
            pageNumber={pageNum} 
            width={(containerWidthState || 800) * scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>

      {/* Page Navigation */}
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <span style={{ margin: '0 15px' }}> Page {pageNum} / {numPages || '?'} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
