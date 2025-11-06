import React from 'react';
import { Document, Page } from 'react-pdf';


export default function PDFViewer({ pdfData, pageNum = 1 }) {
  return (
    <Document file={{ data: pdfData }}>
      <Page pageNumber={pageNum} />
    </Document>
  );
}
