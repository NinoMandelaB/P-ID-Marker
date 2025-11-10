import React, { useState } from 'react';
import PDFViewer from '../components/PDFViewer';
import AnnotationCanvas from '../components/AnnotationCanvas';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

// Assume pdfDoc is an object: {id, filename, ...}
export default function AnnotatePage({ pdfDoc, goBack }) {
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [elements, setElements] = useState([]); // Rect/circle annotations
  const [canvasWidth, setCanvasWidth] = useState(800);

  // State for popup/modal simple metadata form
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingShape, setPendingShape] = useState(null);
  const [form, setForm] = useState({ element_type: '', serial_number: '', position: '', internal_number: '' });

  const pdfUrl = pdfDoc && pdfDoc.id
    ? `https://p-id-marker-production.up.railway.app/api/pid_documents/${pdfDoc.id}/pdf`
    : null;

  // Called when user completes drawing a rectangle/shape
  const handleDrawShape = (shape) => {
    setPendingShape({
      ...shape,
      overlay_page: pageNum,
    });
    setForm({ element_type: '', serial_number: '', position: '', internal_number: '' });
    setModalOpen(true);
  };

  // Save form
  const handleModalSave = () => {
    setElements([
      ...elements,
      {
        ...pendingShape,
        ...form,
        id: Date.now(),
      }
    ]);
    setPendingShape(null);
    setModalOpen(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem' }}>
      <button onClick={goBack}>Back to Uploads</button>
      <h2>Annotate PDF: {pdfDoc?.filename}</h2>
      <div style={{ position: "relative" }}>
        <PDFViewer
          pdfUrl={pdfUrl}
          pageNum={pageNum}
          numPages={numPages}
          onPageChange={setPageNum}
          onDocumentLoad={({ numPages }) => setNumPages(numPages)}
          setContainerWidth={setCanvasWidth}
        />
        <div style={{
          position: "absolute",
          top: 0, left: 0, pointerEvents: "none"
        }}>
          <AnnotationCanvas
            shapes={elements.filter(e => e.overlay_page === pageNum)}
            onDrawShape={handleDrawShape}
            mode="edit"
            width={canvasWidth}
            height={Math.floor(canvasWidth * 1.414)}
          />
        </div>
      </div>

      {/* Popup for new annotation input */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          minWidth: 300
        }}>
          <h3>New Annotation</h3>
          <TextField
            label="Type"
            fullWidth
            margin="dense"
            value={form.element_type}
            onChange={e => setForm({ ...form, element_type: e.target.value })}
          />
          <TextField
            label="Serial Number"
            fullWidth
            margin="dense"
            value={form.serial_number}
            onChange={e => setForm({ ...form, serial_number: e.target.value })}
          />
          <TextField
            label="Position"
            fullWidth
            margin="dense"
            value={form.position}
            onChange={e => setForm({ ...form, position: e.target.value })}
          />
          <TextField
            label="Internal Number"
            fullWidth
            margin="dense"
            value={form.internal_number}
            onChange={e => setForm({ ...form, internal_number: e.target.value })}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => setModalOpen(false)} sx={{ mr: 2 }}>Cancel</Button>
            <Button onClick={handleModalSave} variant="contained">Save</Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
