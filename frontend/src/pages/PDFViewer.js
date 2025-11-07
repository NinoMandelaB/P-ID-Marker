import React from 'react';
import { Document, Page,PDFViewer } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ pdfData, pageNum = 1, onPageChange }) {
  return (
    <div>
      <Document file={{ data: pdfData }} onLoadSuccess={({ numPages }) => onPageChange(pageNum, numPages)}>
        <Page pageNumber={pageNum} />
      </Document>
      <div>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1)}>Prev</button>
        <button onClick={() => onPageChange(pageNum + 1)}>Next</button>
      </div>
    </div>
  );
}
