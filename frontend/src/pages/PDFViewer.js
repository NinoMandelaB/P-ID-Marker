import React, { useRef, useEffect } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/build/pdf.worker.entry';

// Set up workerSrc (only once per app, can safely repeat in component)
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

export default function PDFViewer({ pdfData, pageNum = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfData) return;
    const renderPage = async () => {
      const loadingTask = getDocument({ data: pdfData });
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
