import React from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

export default function PDFViewer({ pdfData, pageNum = 1, onPageChange }) {
  return (
    <div>
      <Document
        file={{ data: pdfData }}
        onLoadSuccess={({ numPages }) => onPageChange(pageNum, numPages)}
      >
        <Page pageNumber={pageNum} />
      </Document>

      <div>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>
          Prev
        </button>
        <button onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
