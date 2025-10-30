import React, { useRef, useEffect } from "react";
import { pdfjs } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function PDFViewer({ pdfData, pageNum = 1, onPageChange, numPages }) {
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
      if (onPageChange) onPageChange(pageNum, pdf.numPages);
    };
    renderPage();
  }, [pdfData, pageNum, onPageChange]);

  return (
    <div>
      <canvas ref={canvasRef} style={{ border: '1px solid #ccc', width: '100%' }} />
      <div>
        <button disabled={pageNum <= 1} onClick={() => onPageChange(pageNum - 1, numPages)}>Prev</button>
        <span> Page {pageNum} / {numPages} </span>
        <button disabled={numPages && pageNum >= numPages} onClick={() => onPageChange(pageNum + 1, numPages)}>Next</button>
      </div>
    </div>
  );
}
