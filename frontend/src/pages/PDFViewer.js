import React, { useRef, useEffect } from 'react';
import { pdfjs } from 'pdfjs-dist';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFViewer({ pdfData, pageNum = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfData) return;
    const renderPage = async () => {
      const loadingTask = pdfjs.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, viewport }).promise;
    };
    renderPage();
  }, [pdfData, pageNum]);

  return (
    <canvas ref={canvasRef} style={{ border: "1px solid #ccc", width: "100%", marginBottom: 16 }} />
  );
}
