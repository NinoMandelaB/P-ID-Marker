// PDFViewer.js
import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up the worker (keep this line)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfUrl, pageNum, numPages, onPageChange, onDocumentLoad }) {
  return (
    <div>
      <Document
        file={pdfUrl}  // Changed: from { data: pdfData } to just pdfUrl
        onLoadSuccess={onDocumentLoad}
      >
        <Page pageNumber={pageNum} />
      </Document>
      <div>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <span> Page {pageNum} / {numPages || '?'} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
