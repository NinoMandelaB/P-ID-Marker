import React from 'react';
import PDFViewer from '../components/PDFViewer';

export default function AnnotatePage({ pdfDoc, goBack }) {
  if (!pdfDoc) {
    return <div>No PDF loaded</div>;
  }

  // Convert base64 PDF string to Uint8Array if needed (adjust as per your backend format)
  let pdfData = null;
  if (pdfDoc.pdf_data) {
    // If pdf_data is base64-encoded:
    try {
      pdfData = Uint8Array.from(atob(pdfDoc.pdf_data), c => c.charCodeAt(0));
    } catch (e) {
      pdfData = null;
    }
    // If pdf_data is already Uint8Array, just use: pdfData = pdfDoc.pdf_data;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc.filename}</h2>
      {pdfData
        ? <PDFViewer pdfData={pdfData} />
        : <div style={{color:'red'}}>No PDF data available for preview.</div>}
    </div>
  );
}
