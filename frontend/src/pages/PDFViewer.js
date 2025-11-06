import React, { useEffect, useRef } from 'react';

export default function PDFViewer({ pdfData, pageNum = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!pdfData || !window.pdfjsLib) return;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    const renderPage = async () => {
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
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
